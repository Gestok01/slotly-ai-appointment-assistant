import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDb> | null = null;
let schemaReady: Promise<void> | null = null;

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return drizzle(neon(databaseUrl), { schema });
}

export function getDb() {
  if (!database) database = createDb();
  return database;
}

export async function ensureDatabase() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
      const sql = neon(databaseUrl);
      await sql`
        CREATE TABLE IF NOT EXISTS appointments (
          id serial PRIMARY KEY,
          reference text NOT NULL UNIQUE,
          customer_name text NOT NULL,
          email text NOT NULL,
          service text NOT NULL,
          appointment_date text NOT NULL,
          appointment_time text NOT NULL,
          notes text NOT NULL DEFAULT '',
          status text NOT NULL DEFAULT 'confirmed',
          created_at text NOT NULL
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
