CREATE TABLE `admin_password_resets` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`version` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`email`) REFERENCES `admin_accounts`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_reset_expiry` ON `admin_password_resets` (`expires_at`);