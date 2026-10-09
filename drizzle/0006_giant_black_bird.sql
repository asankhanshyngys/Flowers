CREATE TABLE `store_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`hours` text DEFAULT '' NOT NULL,
	`map_url` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "location_active" CHECK("store_locations"."active" IN (0,1)),
	CONSTRAINT "location_order" CHECK("store_locations"."display_order" >= 0)
);

--> statement-breakpoint
INSERT INTO store_locations (id,name,address,phone,hours,map_url,active,display_order,version)
VALUES ('flowers-world-example','Flowers world (пример)','Астана, проспект Кабанбай батыра, 14','+7 708 285-16-67','Ежедневно, 09:30–01:00','https://2gis.kz/astana/firm/70000001067393553',1,0,1);
