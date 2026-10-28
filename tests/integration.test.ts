import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { buildApp } from "../src/server/app";
import { pool } from "../src/server/db";
const enabled = process.env.RUN_DB_TESTS === "1";
describe.skipIf(!enabled)("PostgreSQL: fluxo de pedidos", () => {
  let app: Awaited<ReturnType<typeof buildApp>>,
    cookie: string,
    token: string,
    orderId: string;
  const productId = "00000000-0000-4000-8000-000000000001";
  const origin = "http://localhost:5173";
  beforeAll(async () => {
    vi.stubEnv("ADMIN_PASSWORD", "isolated-test-password-only");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T15:00:00Z"));
    app = await buildApp();
    await pool.query(
      "UPDATE products SET stock=10,available=true WHERE id=$1",
      [productId],
    );
  });
  afterAll(async () => {
    await app.close();
    await pool.end();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  it("verifica conexão e catálogo", async () => {
    expect((await app.inject("/api/health")).statusCode).toBe(200);
    expect((await app.inject("/api/menu")).json().products.length).toBe(8);
  });
  it("cria pedido anônimo e reserva estoque", async () => {
    const result = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { origin },
      payload: {
        name: "Aluno Teste",
        items: [{ productId, quantity: 2 }],
        paymentMethod: "pix",
      },
    });
    expect(result.statusCode).toBe(201);
    const body = result.json();
    token = body.token;
    orderId = body.id;
    expect(body.total).toBe(1800);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [productId]))
        .rows[0].stock,
    ).toBe(8);
  });
  it("consulta pedido pelo segredo e bloqueia outros tokens", async () => {
    const result = await app.inject("/api/orders/track/" + token);
    expect(result.json().items[0].quantity).toBe(2);
    expect(result.json()).not.toHaveProperty("tracking_hash");
    expect(
      (await app.inject("/api/orders/track/" + "a".repeat(64))).statusCode,
    ).toBe(404);
  });
  it("rejeita estoque insuficiente sem inserir pedido", async () => {
    const before = (await pool.query("SELECT count(*) FROM orders")).rows[0]
      .count;
    const result = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { origin },
      payload: {
        name: "Aluno",
        items: [{ productId, quantity: 9 }],
        paymentMethod: "card",
      },
    });
    expect(result.statusCode).toBe(409);
    expect(
      (await pool.query("SELECT count(*) FROM orders")).rows[0].count,
    ).toBe(before);
  });
  it("autentica gestor com cookie HttpOnly", async () => {
    const result = await app.inject({
      method: "POST",
      url: "/api/auth/admin",
      headers: { origin },
      payload: { password: "isolated-test-password-only" },
    });
    expect(result.statusCode).toBe(200);
    const setCookie = String(result.headers["set-cookie"]);
    expect(setCookie).toContain("HttpOnly");
    cookie = setCookie.split(";")[0];
    expect(
      (await app.inject({ url: "/api/me", headers: { cookie } })).json().user
        .isAdmin,
    ).toBe(true);
  });
  it("bloqueia entrega sem pagamento e persiste eventos válidos", async () => {
    const patch = (payload: object) =>
      app.inject({
        method: "PATCH",
        url: "/api/admin/orders/" + orderId,
        headers: { origin, cookie },
        payload,
      });
    expect((await patch({ status: "completed" })).statusCode).toBe(409);
    expect((await patch({ status: "preparing" })).statusCode).toBe(200);
    expect((await patch({ status: "ready" })).statusCode).toBe(200);
    expect((await patch({ status: "completed" })).statusCode).toBe(409);
    expect((await patch({ paid: true })).statusCode).toBe(200);
    expect((await patch({ status: "completed" })).statusCode).toBe(200);
    const tracked = (await app.inject("/api/orders/track/" + token)).json();
    expect(tracked.status).toBe("completed");
    expect(tracked.events).toHaveLength(4);
  });
  it("cancelamento repõe estoque uma única vez", async () => {
    const result = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { origin },
      payload: {
        name: "Cancelar",
        items: [{ productId, quantity: 1 }],
        paymentMethod: "card",
      },
    });
    const id = result.json().id;
    const cancel = () =>
      app.inject({
        method: "PATCH",
        url: "/api/admin/orders/" + id,
        headers: { origin, cookie },
        payload: { status: "cancelled" },
      });
    expect((await cancel()).statusCode).toBe(200);
    expect((await cancel()).statusCode).toBe(409);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [productId]))
        .rows[0].stock,
    ).toBe(8);
  });
  it("duas compras concorrentes não vendem o mesmo estoque", async () => {
    await pool.query("UPDATE products SET stock=1 WHERE id=$1", [productId]);
    const buy = () =>
      app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { origin },
        payload: {
          name: "Concorrente",
          items: [{ productId, quantity: 1 }],
          paymentMethod: "pix",
        },
      });
    const results = await Promise.all([buy(), buy()]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(
      (await pool.query("SELECT stock FROM products WHERE id=$1", [productId]))
        .rows[0].stock,
    ).toBe(0);
  });
  it("encerra sessão e perde autorização", async () => {
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/logout",
          headers: { origin, cookie },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ url: "/api/orders", headers: { cookie } }))
        .statusCode,
    ).toBe(401);
  });
});
