-- User-requested example content. Preserve any existing records. Prices are in KZT tiyn.
INSERT OR IGNORE INTO categories (id,name,search_name,active,display_order,updated_at) VALUES ('roses','Розы','розы',1,0,'2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO categories (id,name,search_name,active,display_order,updated_at) VALUES ('tulips','Тюльпаны','тюльпаны',1,1,'2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO categories (id,name,search_name,active,display_order,updated_at) VALUES ('mixed','Сборные букеты','сборные букеты',1,2,'2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO products (id,name,description,category_id,color,price,image,available,status,search_text,created_at,updated_at) VALUES ('rose-reverie','Розовая мечта (пример)','Демонстрационный букет из нежно-розовых роз.','roses','Розовый',3104608,'/images/roses.jpg',0,'published','розовая мечта розовый розы демонстрационный букет','2026-09-07T00:00:00Z','2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO products (id,name,description,category_id,color,price,image,available,status,search_text,created_at,updated_at) VALUES ('cloud-nine','На седьмом небе (пример)','Демонстрационная композиция в белых тонах.','mixed','Белый',3880760,'/images/white.jpg',0,'published','на седьмом небе белый композиция демонстрационный букет','2026-09-07T00:00:00Z','2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO products (id,name,description,category_id,color,price,image,available,status,search_text,created_at,updated_at) VALUES ('tulip-daydream','Тюльпановая нежность (пример)','Демонстрационный букет из розовых тюльпанов.','tulips','Розовый',2191488,'/images/tulips.jpg',0,'published','тюльпановая нежность розовый тюльпаны демонстрационный букет','2026-09-07T00:00:00Z','2026-09-07T00:00:00Z');
--> statement-breakpoint
INSERT OR IGNORE INTO products (id,name,description,category_id,color,price,image,available,status,search_text,created_at,updated_at) VALUES ('garden-party','Цветочный праздник (пример)','Демонстрационный яркий сборный букет.','mixed','Разноцветный',3469856,'/images/mixed.jpg',0,'published','цветочный праздник разноцветный демонстрационный букет','2026-09-07T00:00:00Z','2026-09-07T00:00:00Z');
