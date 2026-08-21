import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDb> | null = null;

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return drizzle(neon(databaseUrl), { schema });
}

export function getDb() {
  if (!database) database = createDb();
  return database;
}
