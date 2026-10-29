import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import { buildApp } from "../src/server/app";
import { pool, hash } from "../src/server/db";
const enabled = process.env.RUN_DB_TESTS === "1";
describe.skipIf(!enabled)("PostgreSQL: pedido antecipado para retirada", () => {
  let app: Awaited<ReturnType<typeof buildApp>>,
    adminCookie: string,
    customerCookie: string,
    orderId: string,
    token: string;
  let requestNumber = 1;
  const productId = "10000000-0000-4000-8000-000000000001";
  const origin = "http://localhost:5173";
  async function customer() {
    const id = randomUUID(),
      credential = randomBytes(32).toString("hex");
    await pool.query(
      "INSERT INTO users(id,google_id,email,name) VALUES($1,$2,$3,'Cliente de teste')",
      [id, id, id + "@example.invalid"],
    );
    await pool.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
      [await hash(credential), id],
    );
    return "session=" + credential;
  }
  const create = async (
    cookie: string,
    quantity = 1,
    items?: { productId: string; quantity: number; ingredients?: string[] }[],
    overrides: Record<string, unknown> = {},
  ) =>
    app.inject({
      method: "POST",
      url: "/api/orders",
      remoteAddress: "127.0.0." + requestNumber++,
      headers: { origin, cookie },
      payload: {
        name: "Cliente de teste",
        items: items || [{ productId, quantity }],
        paymentMethod: "pix",
        pickupAccepted: true,
        location: {
          latitude: -20.78551898,
          longitude: -49.35995068,
          accuracy: 10,
          timestamp: Date.now(),
        },
        ...overrides,
      },
    });
  const patch = (id: string, payload: object, cookie = adminCookie) =>
    app.inject({
      method: "PATCH",
      url: "/api/admin/orders/" + id,
      headers: { origin, cookie },
      payload,
    });
  const stock = async () =>
    (await pool.query("SELECT stock FROM products WHERE id=$1", [productId]))
      .rows[0].stock;
  const getOrder = async (id: string, cookie = customerCookie) =>
    app.inject({ url: "/api/orders/" + id, headers: { cookie } });
  async function expiredLegacyOrder() {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO orders(id,tracking_hash,customer_name,payment_method,total,status,stock_reserved,expires_at) VALUES($1,$2,'Legado','pix',1400,'awaiting_arrival',false,'2000-01-01')",
      [id, await hash(randomUUID())],
    );
    await pool.query(
      "INSERT INTO order_events(order_id,status) VALUES($1,'awaiting_arrival')",
      [id],
    );
    return id;
  }
  beforeAll(async () => {
    vi.stubEnv("ADMIN_PASSWORD", "isolated-test-password-only");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T15:00:00Z"));
    app = await buildApp();
    await pool.query(
      "UPDATE products SET stock=10,available=true,sale_price=null WHERE id=$1",
      [productId],
    );
    customerCookie = await customer();
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/admin",
      headers: { origin },
      payload: { password: "isolated-test-password-only" },
    });
    expect(login.statusCode).toBe(200);
    expect(String(login.headers["set-cookie"])).toContain("HttpOnly");
    adminCookie = String(login.headers["set-cookie"]).split(";")[0];
  });
  afterAll(async () => {
    await app.close();
    await pool.end();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  it("publica o catálogo com pastéis, salgados, mini pizzas e bebidas", async () => {
    expect((await app.inject("/api/health")).statusCode).toBe(200);
    const products = (await app.inject("/api/menu")).json().products;
    expect(products).toHaveLength(37);
    expect(
      products.filter((p: { category: string }) => p.category === "Pastéis"),
    ).toHaveLength(14);
    expect(
      products.filter(
        (p: { category: string; price: number }) =>
          p.category === "Salgados" && p.price === 800,
      ),
    ).toHaveLength(4);
    expect(
      products.filter(
        (p: { category: string; price: number }) =>
          p.category === "Mini pizza" && p.price === 800,
      ),
    ).toHaveLength(3);
    expect(
      products.filter((p: { category: string }) => p.category === "Doces"),
    ).toHaveLength(4);
    expect(
      products.filter((p: { category: string }) => p.category !== "Bebidas"),
    ).toHaveLength(25);
    expect(
      products.filter(
        (p: { name: string; price: number }) =>
          p.name.endsWith("grande") && p.price === 1400,
      ),
    ).toHaveLength(9);
    expect(
      products.filter(
        (p: { name: string; price: number }) =>
          p.name.endsWith("pequeno") && p.price === 800,
      ),
    ).toHaveLength(9);
    expect(
      products.find((p: { name: string }) => p.name === "Monster Original")
        .price,
    ).toBe(1300);
    expect(
      products.filter(
        (p: { name: string; price: number }) =>
          p.name.includes("lata") && p.price === 700,
      ),
    ).toHaveLength(7);
    expect(
      products.filter((p: { price: number }) => p.price === 400),
    ).toHaveLength(4);
  });
  it("exige cliente autenticado e não aceita sessão de gestão sem identidade de cliente", async () => {
    expect((await create("")).statusCode).toBe(401);
    expect((await create(adminCookie)).statusCode).toBe(401);
  });
  it("reserva estoque no envio e preserva o preço para retirada", async () => {
    const response = await create(customerCookie, 2);
    expect(response.statusCode).toBe(201);
    ({ id: orderId, token } = response.json());
    expect(response.json().total).toBe(2800);
    expect(response.json().status).toBe("received");
    expect(await stock()).toBe(8);
    const o = (await getOrder(orderId)).json();
    expect(o.items[0].quantity).toBe(2);
    expect(o.events).toHaveLength(1);
    expect(o.expires_at).toBeNull();
    expect(o.confirmed_at).toBeTruthy();
    expect(o).not.toHaveProperty("tracking_hash");
    expect(o).not.toHaveProperty("user_id");
    expect(
      (
        await pool.query(
          "SELECT stock_reserved,pickup_accepted_at FROM orders WHERE id=$1",
          [orderId],
        )
      ).rows[0],
    ).toMatchObject({
      stock_reserved: true,
      pickup_accepted_at: expect.any(Date),
    });
  });
  it("histórico inclui itens e detalhes só são visíveis ao titular ou gestor", async () => {
    const list = (
      await app.inject({
        url: "/api/orders",
        headers: { cookie: customerCookie },
      })
    ).json();
    expect(
      list.find((o: { id: string }) => o.id === orderId).items[0].quantity,
    ).toBe(2);
    expect((await getOrder(orderId, await customer())).statusCode).toBe(404);
    expect((await getOrder(orderId, "")).statusCode).toBe(401);
    expect((await getOrder(orderId, adminCookie)).json().items).toHaveLength(1);
    expect(
      (
        await app.inject({
          url: "/api/admin/orders/" + orderId + "/items",
          headers: { cookie: customerCookie },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await patch(
          orderId,
          { status: "preparing", paid: true },
          customerCookie,
        )
      ).statusCode,
    ).toBe(403);
  });
  it("preserva acompanhamento legado sem expor hash", async () => {
    const result = (await app.inject("/api/orders/track/" + token)).json();
    expect(result.items[0].quantity).toBe(2);
    expect(result).not.toHaveProperty("tracking_hash");
    expect(
      (await app.inject("/api/orders/track/" + "a".repeat(64))).statusCode,
    ).toBe(404);
  });
  it("rejeita localização ausente, fora do campus, imprecisa ou antiga sem reservar estoque", async () => {
    const cookie = await customer();
    const before = await stock();
    const location = {
      latitude: -20.78551898,
      longitude: -49.35995068,
      accuracy: 10,
      timestamp: Date.now(),
    };
    for (const invalid of [
      undefined,
      { ...location, latitude: -20.81 },
      { ...location, accuracy: 1000 },
      { ...location, timestamp: Date.now() - 10 * 60000 },
    ]) {
      const result = await create(cookie, 1, undefined, { location: invalid });
      expect(result.statusCode).toBeGreaterThanOrEqual(400);
      expect(result.statusCode).toBeLessThan(500);
      expect(await stock()).toBe(before);
    }
    const orders = await app.inject({
      url: "/api/orders",
      headers: { cookie },
    });
    expect(orders.json()).toHaveLength(0);
  });
  it("exige aceite da retirada sem criar pedido ou reservar estoque", async () => {
    const before = await stock();
    const result = await create(await customer(), 1, undefined, {
      pickupAccepted: false,
    });
    expect(result.statusCode).toBe(400);
    expect(await stock()).toBe(before);
  });
  it("prepara antes da chegada sem pagamento e não duplica a reserva", async () => {
    expect(
      (await patch(orderId, { status: "completed", paid: true })).statusCode,
    ).toBe(409);
    expect((await patch(orderId, { status: "preparing" })).statusCode).toBe(
      200,
    );
    expect(await stock()).toBe(8);
    expect((await patch(orderId, { status: "preparing" })).statusCode).toBe(
      409,
    );
    expect(await stock()).toBe(8);
    const o = (await getOrder(orderId)).json();
    expect(o.payment_status).toBe("pending");
    expect(o.confirmed_at).toBeTruthy();
    expect((await patch(orderId, { status: "cancelled" })).statusCode).toBe(
      409,
    );
    expect((await patch(orderId, { status: "ready" })).statusCode).toBe(200);
    expect((await patch(orderId, { status: "completed" })).statusCode).toBe(
      409,
    );
    expect((await getOrder(orderId)).json().status).toBe("ready");
    expect(
      (await patch(orderId, { status: "completed", paid: true })).statusCode,
    ).toBe(200);
    expect((await getOrder(orderId)).json().events).toHaveLength(4);
  });
  it("cancelamento antes do preparo repõe estoque uma única vez", async () => {
    const before = await stock();
    const response = await create(await customer());
    expect(response.statusCode).toBe(201);
    const id = response.json().id;
    expect(await stock()).toBe(before - 1);
    expect(
      (await patch(id, { status: "cancelled", paid: true })).statusCode,
    ).toBe(409);
    expect(await stock()).toBe(before - 1);
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(200);
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(409);
    expect(await stock()).toBe(before);
  });
  it("expiração de pré-pedido legado preserva estoque e não duplica eventos", async () => {
    const before = await stock();
    const id = await expiredLegacyOrder();
    expect((await getOrder(id, adminCookie)).json().status).toBe("expired");
    expect((await getOrder(id, adminCookie)).json().events).toHaveLength(2);
    expect(
      (await patch(id, { status: "preparing", paid: true })).statusCode,
    ).toBe(409);
    expect(await stock()).toBe(before);
  });
  it("verifica validade legada também ao confirmar sem consulta prévia", async () => {
    const before = await stock();
    const id = await expiredLegacyOrder();
    expect(
      (await patch(id, { status: "preparing", paid: true })).statusCode,
    ).toBe(409);
    expect(await stock()).toBe(before);
  });
  it("mantém cancelamento de pedido legado com reposição única", async () => {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO orders(id,tracking_hash,customer_name,payment_method,total,status) VALUES($1,$2,'Legado','pix',1400,'received')",
      [id, await hash(randomUUID())],
    );
    await pool.query(
      "INSERT INTO order_items(order_id,product_id,name,unit_price,quantity) VALUES($1,$2,'Chocolate',1400,1)",
      [id, productId],
    );
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(200);
    expect(await stock()).toBe(9);
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(409);
    expect(await stock()).toBe(9);
  });
  it("limita pedidos ativos por conta inclusive em criação concorrente", async () => {
    const cookie = await customer();
    const responses = await Promise.all([
      create(cookie),
      create(cookie),
      create(cookie),
      create(cookie),
    ]);
    expect(responses.map((r) => r.statusCode).sort()).toEqual([
      201, 201, 201, 409,
    ]);
  });
  it("conta pedidos recebidos, em preparo e prontos no limite por conta", async () => {
    await pool.query("UPDATE products SET stock=10 WHERE id=$1", [productId]);
    const cookie = await customer();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await create(cookie);
      expect(response.statusCode).toBe(201);
      ids.push(response.json().id);
    }
    expect((await patch(ids[1], { status: "preparing" })).statusCode).toBe(200);
    expect((await patch(ids[2], { status: "preparing" })).statusCode).toBe(200);
    expect((await patch(ids[2], { status: "ready" })).statusCode).toBe(200);
    expect((await create(cookie)).statusCode).toBe(409);
    expect((await patch(ids[0], { status: "cancelled" })).statusCode).toBe(200);
    expect((await create(cookie)).statusCode).toBe(201);
  });
  it("duas criações concorrentes não reservam a mesma última unidade", async () => {
    await pool.query("UPDATE products SET stock=1 WHERE id=$1", [productId]);
    const a = await customer(),
      b = await customer();
    const results = await Promise.all([create(a), create(b)]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await stock()).toBe(0);
    const success = results.find((r) => r.statusCode === 201)!;
    const failedCookie = results[0].statusCode === 409 ? a : b;
    expect(
      (await getOrder(success.json().id, adminCookie)).json(),
    ).toMatchObject({
      status: "received",
      payment_status: "pending",
    });
    const failedOrders = await app.inject({
      url: "/api/orders",
      headers: { cookie: failedCookie },
    });
    expect(failedOrders.json()).toHaveLength(0);
  });
  it("indisponibilidade de um item desfaz toda a criação", async () => {
    const second = "10000000-0000-4000-8000-000000000002";
    await pool.query("UPDATE products SET stock=5,available=true WHERE id=$1", [
      productId,
    ]);
    await pool.query(
      "UPDATE products SET stock=5,available=false WHERE id=$1",
      [second],
    );
    const cookie = await customer();
    const response = await create(cookie, 1, [
      { productId, quantity: 1 },
      { productId: second, quantity: 1 },
    ]);
    expect(response.statusCode).toBe(409);
    expect(await stock()).toBe(5);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [second]))
        .rows[0].stock,
    ).toBe(5);
    const orders = await app.inject({
      url: "/api/orders",
      headers: { cookie },
    });
    expect(orders.json()).toHaveLength(0);
  });
  it("preserva o desconto dos combos mistos e os preços dos itens no histórico", async () => {
    const smallId = "10000000-0000-4000-8000-000000000002";
    const drinkId = "10000000-0000-4000-8000-000000000026";
    const ids = [productId, smallId, drinkId];
    await pool.query(
      "UPDATE products SET stock=10,available=true,sale_price=null WHERE id=ANY($1::uuid[])",
      [ids],
    );
    const cookie = await customer();
    const response = await create(
      cookie,
      1,
      [
        { productId, quantity: 2 },
        { productId: smallId, quantity: 2 },
        { productId: drinkId, quantity: 3 },
      ],
      { total: 1, discount_total: 999999 },
    );
    expect(response.statusCode).toBe(201);
    expect(response.json().total).toBe(4800);
    const id = response.json().id;
    const detail = (await getOrder(id, cookie)).json();
    expect(detail.discount_total).toBe(800);
    expect(detail.total).toBe(4800);
    expect(
      detail.items.reduce(
        (sum: number, item: { unit_price: number; quantity: number }) =>
          sum + item.unit_price * item.quantity,
        0,
      ),
    ).toBe(5600);
    const tracked = (
      await app.inject("/api/orders/track/" + response.json().token)
    ).json();
    expect(tracked).toMatchObject({ total: 4800, discount_total: 800 });
    try {
      await pool.query(
        "UPDATE products SET price=price+100 WHERE id=ANY($1::uuid[])",
        [ids],
      );
      const historical = (await getOrder(id, cookie)).json();
      expect(historical).toMatchObject({ total: 4800, discount_total: 800 });
      expect(historical.items).toEqual(detail.items);
    } finally {
      await pool.query(
        "UPDATE products SET price=CASE WHEN id=$1 THEN 1400 WHEN id=$2 THEN 800 ELSE 400 END WHERE id=ANY($3::uuid[])",
        [productId, smallId, ids],
      );
    }
  });
  it("cancelar um combo repõe cada componente uma única vez", async () => {
    const smallId = "10000000-0000-4000-8000-000000000002";
    const drinkId = "10000000-0000-4000-8000-000000000027";
    const ids = [productId, smallId, drinkId];
    await pool.query(
      "UPDATE products SET stock=10,available=true,sale_price=null WHERE id=ANY($1::uuid[])",
      [ids],
    );
    const response = await create(await customer(), 1, [
      { productId, quantity: 1 },
      { productId: smallId, quantity: 1 },
      { productId: drinkId, quantity: 2 },
    ]);
    expect(response.statusCode).toBe(201);
    expect(response.json().total).toBe(2500);
    const id = response.json().id;
    expect(
      (
        await pool.query(
          "SELECT id,stock FROM products WHERE id=ANY($1::uuid[]) ORDER BY id",
          [ids],
        )
      ).rows.map((p) => p.stock),
    ).toEqual([9, 9, 8]);
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(200);
    expect((await patch(id, { status: "cancelled" })).statusCode).toBe(409);
    expect(
      (
        await pool.query(
          "SELECT stock FROM products WHERE id=ANY($1::uuid[])",
          [ids],
        )
      ).rows.map((p) => p.stock),
    ).toEqual([10, 10, 10]);
  });
  it("mantém o menor preço avulso quando uma promoção já é mais barata que o combo", async () => {
    const smallId = "10000000-0000-4000-8000-000000000002";
    const drinkId = "10000000-0000-4000-8000-000000000026";
    await pool.query(
      "UPDATE products SET stock=5,available=true,sale_price=400 WHERE id=$1",
      [smallId],
    );
    await pool.query(
      "UPDATE products SET stock=5,available=true,sale_price=null WHERE id=$1",
      [drinkId],
    );
    try {
      const cookie = await customer();
      const result = await create(cookie, 1, [
        { productId: smallId, quantity: 1 },
        { productId: drinkId, quantity: 1 },
      ]);
      expect(result.statusCode).toBe(201);
      expect(result.json().total).toBe(800);
      expect((await getOrder(result.json().id, cookie)).json()).toMatchObject({
        total: 800,
        discount_total: 0,
      });
    } finally {
      await pool.query("UPDATE products SET sale_price=null WHERE id=$1", [
        smallId,
      ]);
    }
  });
  it("falta de refrigerante desfaz a reserva de todo o combo", async () => {
    const drinkId = "10000000-0000-4000-8000-000000000026";
    await pool.query("UPDATE products SET stock=5,available=true WHERE id=$1", [
      productId,
    ]);
    await pool.query("UPDATE products SET stock=0,available=true WHERE id=$1", [
      drinkId,
    ]);
    const cookie = await customer();
    const result = await create(cookie, 1, [
      { productId, quantity: 1 },
      { productId: drinkId, quantity: 1 },
    ]);
    expect(result.statusCode).toBe(409);
    expect(await stock()).toBe(5);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [drinkId]))
        .rows[0].stock,
    ).toBe(0);
    expect(
      (await app.inject({ url: "/api/orders", headers: { cookie } })).json(),
    ).toHaveLength(0);
  });
  it("preserva os três ingredientes da mini pizza personalizada no pedido", async () => {
    const pizzaId = "10000000-0000-4000-8000-000000000037";
    await pool.query("UPDATE products SET stock=5,available=true WHERE id=$1", [
      pizzaId,
    ]);
    const cookie = await customer();
    const ingredients = ["carne", "queijo", "palmito"];
    const ingredientLabels = ["Carne", "Queijo", "Palmito"];
    const result = await create(cookie, 1, [
      { productId: pizzaId, quantity: 2, ingredients },
    ]);
    expect(result.statusCode).toBe(201);
    expect(result.json().total).toBe(1600);
    const order = (await getOrder(result.json().id, cookie)).json();
    expect(order.discount_total).toBe(0);
    expect(order.items[0]).toMatchObject({
      quantity: 2,
      unit_price: 800,
      ingredients: ingredientLabels,
    });
    expect(
      (
        await pool.query(
          "SELECT ingredients FROM order_items WHERE order_id=$1",
          [result.json().id],
        )
      ).rows[0].ingredients,
    ).toEqual(ingredientLabels);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [pizzaId]))
        .rows[0].stock,
    ).toBe(3);
  });
  it("rejeita mais de três ingredientes, repetidos, desconhecidos ou em produto comum sem baixar estoque", async () => {
    const pizzaId = "10000000-0000-4000-8000-000000000037";
    const commonPizzaId = "10000000-0000-4000-8000-000000000035";
    const ids = [pizzaId, commonPizzaId];
    await pool.query(
      "UPDATE products SET stock=5,available=true WHERE id=ANY($1::uuid[])",
      [ids],
    );
    const cookie = await customer();
    for (const item of [
      {
        productId: pizzaId,
        quantity: 1,
        ingredients: ["carne", "queijo", "frango", "palmito"],
      },
      { productId: pizzaId, quantity: 1, ingredients: ["queijo", "queijo"] },
      {
        productId: pizzaId,
        quantity: 1,
        ingredients: ["ingrediente-inexistente"],
      },
      { productId: commonPizzaId, quantity: 1, ingredients: ["queijo"] },
    ]) {
      const result = await create(cookie, 1, [item]);
      expect(result.statusCode).toBeGreaterThanOrEqual(400);
      expect(result.statusCode).toBeLessThan(500);
    }
    expect(
      (
        await pool.query(
          "SELECT stock FROM products WHERE id=ANY($1::uuid[])",
          [ids],
        )
      ).rows.map((p) => p.stock),
    ).toEqual([5, 5]);
    expect(
      (await app.inject({ url: "/api/orders", headers: { cookie } })).json(),
    ).toHaveLength(0);
  });
  it("bloqueia entrega de legado sem pagamento e encerra sessão", async () => {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO orders(id,tracking_hash,customer_name,payment_method,total,status) VALUES($1,$2,'Legado','pix',1400,'ready')",
      [id, await hash(randomUUID())],
    );
    expect((await patch(id, { status: "completed" })).statusCode).toBe(409);
    expect(
      (await patch(id, { status: "completed", paid: true })).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/logout",
          headers: { origin, cookie: adminCookie },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          url: "/api/orders",
          headers: { cookie: adminCookie },
        })
      ).statusCode,
    ).toBe(401);
  });
});
