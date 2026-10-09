ALTER TABLE `store_locations` ADD `coordinates` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE store_locations SET coordinates='51.14245, 71.420112' WHERE coordinates='' AND map_url='https://2gis.kz/astana/firm/70000001067393553';
