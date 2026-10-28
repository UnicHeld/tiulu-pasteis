import { readFile } from "node:fs/promises";
import { pool } from "./db.js";
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(823761)");
  await client.query(
    await readFile(
      new URL("../../db/001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  await client.query("COMMIT");
  console.log("Schema e catálogo inicial aplicados.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
