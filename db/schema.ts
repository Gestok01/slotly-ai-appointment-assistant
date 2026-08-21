import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  service: text("service").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status", { enum: ["confirmed", "completed", "cancelled"] }).notNull().default("confirmed"),
  createdAt: text("created_at").notNull(),
});
