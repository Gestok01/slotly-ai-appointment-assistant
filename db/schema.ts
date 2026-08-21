import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
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
