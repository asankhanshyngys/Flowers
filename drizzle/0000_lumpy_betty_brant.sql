CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`search_name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "category_active" CHECK("categories"."active" IN (0,1)),
	CONSTRAINT "category_order" CHECK("categories"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` text NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`search_text` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "product_price" CHECK(typeof("products"."price") = 'integer' AND "products"."price" BETWEEN 0 AND 100000000),
	CONSTRAINT "product_available" CHECK("products"."available" IN (0,1)),
	CONSTRAINT "product_status" CHECK("products"."status" IN ('draft','published','archived')),
	CONSTRAINT "product_order" CHECK("products"."display_order" >= 0)
);
--> statement-breakpoint
CREATE INDEX `products_public_order` ON `products` (`status`,`display_order`,`id`);--> statement-breakpoint
CREATE INDEX `products_public_price` ON `products` (`status`,`price`,`id`);--> statement-breakpoint
CREATE INDEX `products_category` ON `products` (`category_id`,`status`);