import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z, ZodError } from "zod";
import { pool, hash } from "./db.js";
import {
  priceOrder,
  pizzaIngredients,
  comboPrices,
} from "../domain/catalog.js";
import { assertCampusLocation, LocationError } from "../domain/campus.js";
import {
  orderInput,
  totalOrder,
  effectivePrice,
  assertSchedule,
  assertTransition,
  statuses,
  DomainError,
  type Product,
} from "../domain/orders.js";
const origin = process.env.APP_ORIGIN || "http://localhost:5173";
const production = process.env.NODE_ENV === "production";
export async function buildApp() {
  const app = Fastify({
    logger: {
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url.startsWith("/api/orders/track/")
              ? "/api/orders/track/[REDACTED]"
              : req.url.split("?")[0],
          };
        },
      },
      redact: [
        "req.headers.cookie",
        "req.headers.authorization",
        "res.headers.set-cookie",
      ],
    },
    bodyLimit: 16384,
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  app.addHook("onRequest", async (req, reply) => {
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer")
      .header("X-Frame-Options", "DENY");
    if (req.url.startsWith("/api")) reply.header("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin !== origin
    )
      return reply.code(403).send({ error: "Origem inválida." });
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError)
      return reply
        .code(400)
        .send({ error: "Dados inválidos. Confira os campos." });
    if (error instanceof LocationError)
      return reply.code(403).send({ error: error.message });
    if (error instanceof DomainError)
      return reply.code(409).send({ error: error.message });
    if (
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode < 500
    )
      return reply.code(error.statusCode).send({ error: error.message });
    app.log.error({ err: error }, "Falha interna");
    return reply
      .code(500)
      .send({ error: "Não foi possível concluir. Tente novamente." });
  });
  async function session(token: string | undefined) {
    if (!token) return null;
    return (
      (
        await pool.query(
          "SELECT s.*, u.name, u.email FROM sessions s LEFT JOIN users u ON u.id=s.user_id WHERE token_hash=$1 AND expires_at>now()",
          [await hash(token)],
        )
      ).rows[0] || null
    );
  }
  async function createSession(
    reply: import("fastify").FastifyReply,
    userId: string | null,
    isAdmin: boolean,
  ) {
    const token = randomBytes(32).toString("hex");
    await pool.query(
      "INSERT INTO sessions(token_hash,user_id,is_admin,expires_at) VALUES($1,$2,$3,now()+interval '7 days')",
      [await hash(token), userId, isAdmin],
    );
    reply.setCookie("session", token, {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  }
  app.get("/api/health", async () => {
    await pool.query("SELECT 1");
    return { ok: true };
  });
  app.get("/api/menu", async () => ({
    products: (
      await pool.query(
        "SELECT * FROM products WHERE archived=false ORDER BY category DESC,name",
      )
    ).rows,
    pizzaIngredients,
    promotion: { comboPrices },
    store: {
      name: "Tiulu Pastéis",
      hours: "Segunda a sexta, 9h às 21h",
      paymentMode: "pickup",
      verocard: false,
      orderMode: "campus_pickup",
      pickupLocation:
        "Fundos da ASTAIBILCE, no campus IBILCE/UNESP — São José do Rio Preto",
      onlinePaymentEnabled: false,
    },
  }));
  app.get("/api/me", async (req) => {
    const s = await session(req.cookies.session);
    if (!s)
      return {
        user: null,
        googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      };
    const count = s.user_id
      ? (
          await pool.query(
            "SELECT count(*)::int AS count FROM orders WHERE user_id=$1 AND status='completed' AND payment_status='paid'",
            [s.user_id],
          )
        ).rows[0].count
      : 0;
    return {
      user: {
        name: s.name || "Pasteleiro",
        isAdmin: s.is_admin,
        points: count,
      },
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    };
  });
  app.post(
    "/api/auth/admin",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const { password } = z
        .object({ password: z.string().max(200) })
        .parse(req.body);
      const expected = process.env.ADMIN_PASSWORD;
      if (
        !expected ||
        expected.length < 16 ||
        !timingSafeEqual(
          Buffer.from(await hash(password)),
          Buffer.from(await hash(expected)),
        )
      )
        return reply
          .code(401)
          .send({ error: "Credenciais inválidas ou acesso não configurado." });
      await createSession(reply, null, true);
      return { ok: true };
    },
  );
  app.post("/api/auth/logout", async (req, reply) => {
    if (req.cookies.session)
      await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
        await hash(req.cookies.session),
      ]);
    reply.clearCookie("session", { path: "/" });
    return { ok: true };
  });
  app.get("/api/auth/google", async (_req, reply) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
      return reply
        .code(503)
        .send({ error: "Login Google ainda não configurado." });
    const state = randomBytes(32).toString("hex");
    reply.setCookie("oauth_state", state, {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      path: "/api/auth/google/callback",
      maxAge: 600,
    });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: origin + "/api/auth/google/callback",
      response_type: "code",
      scope: "openid email profile",
      state,
    });
    return reply.redirect(
      "https://accounts.google.com/o/oauth2/v2/auth?" + params,
    );
  });
  app.get("/api/auth/google/callback", async (req, reply) => {
    const query = z
      .object({ code: z.string().max(2048), state: z.string().length(64) })
      .parse(req.query);
    if (!req.cookies.oauth_state || query.state !== req.cookies.oauth_state)
      return reply.code(400).send({ error: "Sessão de login inválida." });
    reply.clearCookie("oauth_state", { path: "/api/auth/google/callback" });
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: query.code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: origin + "/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("OAuth token exchange failed");
    const token = z
      .object({ access_token: z.string() })
      .parse(await response.json());
    const info = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!info.ok) throw new Error("OAuth userinfo failed");
    const user = z
      .object({
        sub: z.string(),
        email: z.string().email(),
        email_verified: z.literal(true),
        name: z.string(),
      })
      .parse(await info.json());
    const result = await pool.query(
      "INSERT INTO users(id,google_id,email,name) VALUES($1,$2,$3,$4) ON CONFLICT(google_id) DO UPDATE SET email=excluded.email,name=excluded.name RETURNING id",
      [randomUUID(), user.sub, user.email, user.name],
    );
    const admin = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(user.email.toLowerCase());
    await createSession(reply, result.rows[0].id, admin);
    return reply.redirect(admin ? "/gestao" : "/");
  });
  app.post(
    "/api/orders",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const input = orderInput.parse(req.body);
      assertSchedule(
        input.scheduledAt,
        new Date(),
        process.env.NODE_ENV === "development" &&
          process.env.ALLOW_OUT_OF_HOURS_ORDERS === "1",
      );
      if (input.paymentMethod === "verocard")
        throw new DomainError("Verocard ainda não habilitado.");
      const s = await session(req.cookies.session);
      if (!s?.user_id)
        return reply
          .code(401)
          .send({ error: "Entre na sua conta para registrar o pedido." });
      assertCampusLocation(input.location);
      await expireOrders();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Serializa o limite por conta, inclusive em requisições concorrentes.
        await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
          s.user_id,
        ]);
        const active = (
          await client.query(
            "SELECT count(*)::int AS count FROM orders WHERE user_id=$1 AND status IN ('received','preparing','ready','awaiting_arrival')",
            [s.user_id],
          )
        ).rows[0].count;
        if (active >= 3)
          throw new DomainError(
            "Você já tem três pedidos ativos. Aguarde a retirada ou solicite o cancelamento no balcão.",
          );
        const products = (
          await client.query(
            "SELECT * FROM products WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
            [input.items.map((i) => i.productId)],
          )
        ).rows as Product[];
        const total = totalOrder(input.items, products);
        const { discount } = priceOrder(input.items, products);
        const id = randomUUID();
        const token = randomBytes(32).toString("hex");
        await client.query(
          "INSERT INTO orders(id,tracking_hash,user_id,customer_name,payment_method,total,notes,status,stock_reserved,expires_at,pickup_accepted_at,confirmed_at,discount_total) VALUES($1,$2,$3,$4,$5,$6,$7,'received',true,NULL,now(),now(),$8)",
          [
            id,
            await hash(token),
            s.user_id,
            input.name,
            input.paymentMethod,
            total,
            input.notes,
            discount,
          ],
        );
        for (const item of input.items) {
          const p = products.find((p) => p.id === item.productId)!;
          await client.query("UPDATE products SET stock=stock-$1 WHERE id=$2", [
            item.quantity,
            p.id,
          ]);
          await client.query(
            "INSERT INTO order_items(order_id,product_id,name,unit_price,quantity,ingredients) VALUES($1,$2,$3,$4,$5,$6)",
            [
              id,
              p.id,
              p.name,
              effectivePrice(p),
              item.quantity,
              JSON.stringify(
                item.ingredients.map(
                  (id) =>
                    pizzaIngredients.find((ingredient) => ingredient.id === id)!
                      .label,
                ),
              ),
            ],
          );
        }
        await client.query(
          "INSERT INTO order_events(order_id,status) VALUES($1,'received')",
          [id],
        );
        await client.query("COMMIT");
        return reply.code(201).send({ id, token, total, status: "received" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  );
  app.get("/api/orders/track/:token", async (req, reply) => {
    const { token } = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
      .parse(req.params);
    await expireOrders();
    const order = (
      await pool.query(
        "SELECT id,customer_name,status,payment_method,payment_status,total,discount_total,scheduled_at,created_at,expires_at,confirmed_at FROM orders WHERE tracking_hash=$1",
        [await hash(token)],
      )
    ).rows[0];
    if (!order)
      return reply.code(404).send({ error: "Pedido não encontrado." });
    return {
      ...order,
      items: (
        await pool.query(
          "SELECT name,quantity,unit_price,ingredients FROM order_items WHERE order_id=$1",
          [order.id],
        )
      ).rows,
      events: (
        await pool.query(
          "SELECT status,created_at FROM order_events WHERE order_id=$1 ORDER BY id",
          [order.id],
        )
      ).rows,
    };
  });
  const orderColumns = `o.id,o.customer_name,o.status,o.payment_status,o.payment_method,o.total,o.discount_total,o.scheduled_at,o.notes,o.created_at,o.expires_at,o.confirmed_at,
    COALESCE((SELECT json_agg(json_build_object('name',i.name,'quantity',i.quantity,'unit_price',i.unit_price,'ingredients',i.ingredients) ORDER BY i.name) FROM order_items i WHERE i.order_id=o.id),'[]'::json) AS items`;
  async function expireOrders() {
    // Sem reserva ou cobrança: expiração não toca no estoque nem no pagamento.
    await pool.query(`WITH expired AS (
      UPDATE orders SET status='expired' WHERE status='awaiting_arrival' AND expires_at<=now() RETURNING id
    ) INSERT INTO order_events(order_id,status) SELECT id,'expired' FROM expired`);
  }
  app.get("/api/orders", async (req, reply) => {
    const s = await session(req.cookies.session);
    if (!s) return reply.code(401).send({ error: "Entre na sua conta." });
    await expireOrders();
    return (
      await pool.query(
        `SELECT ${orderColumns} FROM orders o ${s.is_admin ? "" : "WHERE o.user_id=$1"}
       ORDER BY COALESCE(o.confirmed_at,o.created_at) DESC,o.id LIMIT 100`,
        s.is_admin ? [] : [s.user_id],
      )
    ).rows;
  });
  app.get("/api/orders/:id", async (req, reply) => {
    const s = await session(req.cookies.session);
    if (!s) return reply.code(401).send({ error: "Entre na sua conta." });
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await expireOrders();
    const order = (
      await pool.query(
        `SELECT ${orderColumns} FROM orders o WHERE o.id=$1 ${s.is_admin ? "" : "AND o.user_id=$2"}`,
        s.is_admin ? [id] : [id, s.user_id],
      )
    ).rows[0];
    if (!order)
      return reply.code(404).send({ error: "Pedido não encontrado." });
    return {
      ...order,
      events: (
        await pool.query(
          "SELECT status,created_at FROM order_events WHERE order_id=$1 ORDER BY id",
          [id],
        )
      ).rows,
    };
  });
  app.get("/api/admin/orders/:id/items", async (req, reply) => {
    const s = await session(req.cookies.session);
    if (!s?.is_admin)
      return reply.code(403).send({ error: "Acesso restrito." });
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    return (
      await pool.query(
        "SELECT name,quantity,unit_price,ingredients FROM order_items WHERE order_id=$1",
        [id],
      )
    ).rows;
  });
  app.patch("/api/admin/orders/:id", async (req, reply) => {
    const s = await session(req.cookies.session);
    if (!s?.is_admin)
      return reply.code(403).send({ error: "Acesso restrito." });
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = z
      .object({
        status: z.enum(statuses).optional(),
        paid: z.literal(true).optional(),
      })
      .refine((v) => Boolean(v.status) || v.paid)
      .parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const order = (
        await client.query(
          "SELECT *,expires_at<=now() AS is_expired FROM orders WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!order) {
        await client.query("ROLLBACK");
        return reply.code(404).send({ error: "Pedido não encontrado." });
      }
      if (order.status === "awaiting_arrival" && order.is_expired) {
        throw new DomainError("Pedido expirado. Registre um novo pedido.");
      }
      if (input.status) {
        assertTransition(order.status, input.status);
        if (input.status === "expired")
          throw new DomainError("Expiração é automática.");
        if (
          order.status === "awaiting_arrival" &&
          input.status === "preparing"
        ) {
          assertSchedule(
            undefined,
            new Date(),
            process.env.NODE_ENV === "development" &&
              process.env.ALLOW_OUT_OF_HOURS_ORDERS === "1",
          );
          if (order.payment_status !== "paid" && !input.paid)
            throw new DomainError(
              "Confirme a presença e o pagamento no balcão antes do preparo.",
            );
          const items = (
            await client.query(
              "SELECT product_id,quantity FROM order_items WHERE order_id=$1 ORDER BY product_id",
              [id],
            )
          ).rows;
          const products = (
            await client.query(
              "SELECT * FROM products WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
              [items.map((i) => i.product_id)],
            )
          ).rows as Product[];
          totalOrder(
            items.map((i) => ({
              productId: i.product_id,
              quantity: i.quantity,
            })),
            products,
          );
          for (const item of items)
            await client.query(
              "UPDATE products SET stock=stock-$1 WHERE id=$2",
              [item.quantity, item.product_id],
            );
          await client.query(
            "UPDATE orders SET stock_reserved=true,confirmed_at=now() WHERE id=$1",
            [id],
          );
        }
        if (
          input.status === "completed" &&
          order.payment_status !== "paid" &&
          !input.paid
        )
          throw new DomainError("Confirme o pagamento antes de entregar.");
        await client.query("UPDATE orders SET status=$1 WHERE id=$2", [
          input.status,
          id,
        ]);
        await client.query(
          "INSERT INTO order_events(order_id,status) VALUES($1,$2)",
          [id, input.status],
        );
        if (input.status === "cancelled" && order.stock_reserved) {
          await client.query(
            "SELECT id FROM products WHERE id IN (SELECT product_id FROM order_items WHERE order_id=$1) ORDER BY id FOR UPDATE",
            [id],
          );
          await client.query(
            "UPDATE products p SET stock=p.stock+i.quantity FROM order_items i WHERE i.order_id=$1 AND i.product_id=p.id",
            [id],
          );
        }
        if (input.status === "cancelled")
          await client.query(
            "UPDATE orders SET stock_reserved=false WHERE id=$1",
            [id],
          );
      }
      if (input.paid) {
        if (["cancelled", "expired"].includes(input.status || order.status))
          throw new DomainError("Pedido encerrado.");
        if (order.status === "awaiting_arrival" && input.status !== "preparing")
          throw new DomainError(
            "Confirme presença e pagamento ao iniciar o preparo.",
          );
        await client.query(
          "UPDATE orders SET payment_status='paid' WHERE id=$1",
          [id],
        );
      }
      await client.query("COMMIT");
      return { ok: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });
  app.patch("/api/admin/products/:id", async (req, reply) => {
    const s = await session(req.cookies.session);
    if (!s?.is_admin)
      return reply.code(403).send({ error: "Acesso restrito." });
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = z
      .object({
        available: z.boolean(),
        stock: z.number().int().min(0).max(10000),
        salePrice: z
          .number()
          .int()
          .positive()
          .max(100000)
          .nullable()
          .default(null),
      })
      .parse(req.body);
    const result = await pool.query(
      "UPDATE products SET available=$1,stock=$2,sale_price=$4 WHERE id=$3 AND ($4::integer IS NULL OR $4<price) RETURNING id",
      [input.available, input.stock, id, input.salePrice],
    );
    if (!result.rowCount)
      return reply.code(404).send({
        error: "Produto não encontrado ou promoção maior que o preço normal.",
      });
    return { ok: true };
  });
  return app;
}
