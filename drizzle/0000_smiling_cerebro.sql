CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"customer_name" text NOT NULL,
	"email" text NOT NULL,
	"service" text NOT NULL,
	"appointment_date" text NOT NULL,
	"appointment_time" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "appointments_reference_unique" UNIQUE("reference")
);
