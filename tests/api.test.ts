import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { buildApp } from "../src/server/app";
import { pool } from "../src/server/db";
let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  app = await buildApp();
});
afterAll(async () => {
  await app.close();
  await pool.end();
});
describe("Proteção HTTP", () => {
  it("rejeita mutação de outra origem antes de acessar banco", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { origin: "https://evil.example" },
      payload: {},
    });
    expect(r.statusCode).toBe(403);
  });
  it("rejeita entrada inválida sem acessar banco", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: { origin: "http://localhost:5173" },
      payload: { name: "x", items: [] },
    });
    expect(r.statusCode).toBe(400);
  });
  it("nega painel sem sessão", async () => {
    const r = await app.inject({
      method: "PATCH",
      url: "/api/admin/orders/00000000-0000-4000-8000-000000000001",
      headers: { origin: "http://localhost:5173" },
      payload: { status: "completed" },
    });
    expect(r.statusCode).toBe(403);
  });
  it("não expõe erro interno ou token para código malformado", async () => {
    const r = await app.inject("/api/orders/track/foo");
    expect(r.statusCode).toBe(400);
    expect(r.json()).toEqual({ error: "Dados inválidos. Confira os campos." });
    expect(r.headers["cache-control"]).toBe("no-store");
  });
  it("não permite autenticação de gestão sem configuração", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/auth/admin",
      headers: { origin: "http://localhost:5173" },
      payload: { password: "invalid" },
    });
    expect(r.statusCode).toBe(401);
  });
});
