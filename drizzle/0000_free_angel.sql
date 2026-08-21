CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`service` text NOT NULL,
	`appointment_date` text NOT NULL,
	`appointment_time` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_reference_unique` ON `appointments` (`reference`);