import { readFile, readdir } from "node:fs/promises";
import { pool } from "./db.js";
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(823761)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const directory = new URL("../../db/", import.meta.url);
  for (const name of (await readdir(directory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort()) {
    if (
      (
        await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
          name,
        ])
      ).rowCount
    )
      continue;
    await client.query(await readFile(new URL(name, directory), "utf8"));
    await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
      name,
    ]);
  }
  await client.query("COMMIT");
  console.log("Schema e catálogo inicial aplicados.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
