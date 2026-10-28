import pg from "pg";
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const hash = async (value: string) => {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
};
