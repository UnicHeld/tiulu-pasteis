import { buildApp } from "./app.js";
import fastifyStatic from "@fastify/static";
import { resolve } from "node:path";
const app = await buildApp();
if (process.env.NODE_ENV === "production") {
  if (!process.env.APP_ORIGIN?.startsWith("https://"))
    throw new Error("APP_ORIGIN deve usar HTTPS em produção.");
  await app.register(fastifyStatic, { root: resolve("dist") });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith("/api/")
      ? reply.code(404).send({ error: "Rota não encontrada." })
      : reply.sendFile("index.html"),
  );
}
await app.listen({ port: Number(process.env.PORT || 3000), host: "0.0.0.0" });
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await app.close();
    const { pool } = await import("./db.js");
    await pool.end();
    process.exit(0);
  });
