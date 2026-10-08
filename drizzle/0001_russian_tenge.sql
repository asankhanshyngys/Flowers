-- One-time USD cents -> KZT tiyn. NBK 2026-09-07: 1 USD = 456.56 KZT.
-- Integer rounding to the nearest tiyn. Migration tracking prevents repeat conversion.
UPDATE products SET price = CAST((price * 45656 + 50) / 100 AS INTEGER), version = version + 1;
--> statement-breakpoint
UPDATE categories SET name = CASE name WHEN 'Roses' THEN 'Розы' WHEN 'Tulips' THEN 'Тюльпаны' WHEN 'Mixed bouquets' THEN 'Сборные букеты' WHEN 'Rose Reverie' THEN 'Розовая мечта' WHEN 'Cloud Nine' THEN 'На седьмом небе' WHEN 'Tulip Daydream' THEN 'Тюльпановая нежность' WHEN 'Garden Party' THEN 'Цветочный праздник' WHEN 'Private draft' THEN 'Личный черновик' WHEN 'Pink' THEN 'Розовый' WHEN 'White' THEN 'Белый' WHEN 'Mixed' THEN 'Разноцветный' WHEN 'Development sample: soft pink roses.' THEN 'Демонстрационный букет из нежно-розовых роз.' WHEN 'Development sample: a white arrangement.' THEN 'Демонстрационная композиция в белых тонах.' WHEN 'Development sample: pink tulips.' THEN 'Демонстрационный букет из розовых тюльпанов.' WHEN 'Development sample: a colorful mixed bouquet.' THEN 'Демонстрационный яркий сборный букет.' ELSE name END;
--> statement-breakpoint
UPDATE products SET name = CASE name WHEN 'Roses' THEN 'Розы' WHEN 'Tulips' THEN 'Тюльпаны' WHEN 'Mixed bouquets' THEN 'Сборные букеты' WHEN 'Rose Reverie' THEN 'Розовая мечта' WHEN 'Cloud Nine' THEN 'На седьмом небе' WHEN 'Tulip Daydream' THEN 'Тюльпановая нежность' WHEN 'Garden Party' THEN 'Цветочный праздник' WHEN 'Private draft' THEN 'Личный черновик' WHEN 'Pink' THEN 'Розовый' WHEN 'White' THEN 'Белый' WHEN 'Mixed' THEN 'Разноцветный' WHEN 'Development sample: soft pink roses.' THEN 'Демонстрационный букет из нежно-розовых роз.' WHEN 'Development sample: a white arrangement.' THEN 'Демонстрационная композиция в белых тонах.' WHEN 'Development sample: pink tulips.' THEN 'Демонстрационный букет из розовых тюльпанов.' WHEN 'Development sample: a colorful mixed bouquet.' THEN 'Демонстрационный яркий сборный букет.' ELSE name END;
--> statement-breakpoint
UPDATE products SET description = CASE description WHEN 'Roses' THEN 'Розы' WHEN 'Tulips' THEN 'Тюльпаны' WHEN 'Mixed bouquets' THEN 'Сборные букеты' WHEN 'Rose Reverie' THEN 'Розовая мечта' WHEN 'Cloud Nine' THEN 'На седьмом небе' WHEN 'Tulip Daydream' THEN 'Тюльпановая нежность' WHEN 'Garden Party' THEN 'Цветочный праздник' WHEN 'Private draft' THEN 'Личный черновик' WHEN 'Pink' THEN 'Розовый' WHEN 'White' THEN 'Белый' WHEN 'Mixed' THEN 'Разноцветный' WHEN 'Development sample: soft pink roses.' THEN 'Демонстрационный букет из нежно-розовых роз.' WHEN 'Development sample: a white arrangement.' THEN 'Демонстрационная композиция в белых тонах.' WHEN 'Development sample: pink tulips.' THEN 'Демонстрационный букет из розовых тюльпанов.' WHEN 'Development sample: a colorful mixed bouquet.' THEN 'Демонстрационный яркий сборный букет.' ELSE description END;
--> statement-breakpoint
UPDATE products SET color = CASE color WHEN 'Roses' THEN 'Розы' WHEN 'Tulips' THEN 'Тюльпаны' WHEN 'Mixed bouquets' THEN 'Сборные букеты' WHEN 'Rose Reverie' THEN 'Розовая мечта' WHEN 'Cloud Nine' THEN 'На седьмом небе' WHEN 'Tulip Daydream' THEN 'Тюльпановая нежность' WHEN 'Garden Party' THEN 'Цветочный праздник' WHEN 'Private draft' THEN 'Личный черновик' WHEN 'Pink' THEN 'Розовый' WHEN 'White' THEN 'Белый' WHEN 'Mixed' THEN 'Разноцветный' WHEN 'Development sample: soft pink roses.' THEN 'Демонстрационный букет из нежно-розовых роз.' WHEN 'Development sample: a white arrangement.' THEN 'Демонстрационная композиция в белых тонах.' WHEN 'Development sample: pink tulips.' THEN 'Демонстрационный букет из розовых тюльпанов.' WHEN 'Development sample: a colorful mixed bouquet.' THEN 'Демонстрационный яркий сборный букет.' ELSE color END;
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'roses','розы');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'tulips','тюльпаны');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'mixed bouquets','сборные букеты');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'rose reverie','розовая мечта');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'cloud nine','на седьмом небе');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'tulip daydream','тюльпановая нежность');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'garden party','цветочный праздник');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'private draft','личный черновик');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'pink','розовый');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'white','белый');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'mixed','разноцветный');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'development sample: soft pink roses.','демонстрационный букет из нежно-розовых роз.');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'development sample: a white arrangement.','демонстрационная композиция в белых тонах.');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'development sample: pink tulips.','демонстрационный букет из розовых тюльпанов.');
--> statement-breakpoint
UPDATE categories SET search_name=replace(search_name,'development sample: a colorful mixed bouquet.','демонстрационный яркий сборный букет.');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'roses','розы');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'tulips','тюльпаны');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'mixed bouquets','сборные букеты');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'rose reverie','розовая мечта');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'cloud nine','на седьмом небе');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'tulip daydream','тюльпановая нежность');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'garden party','цветочный праздник');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'private draft','личный черновик');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'pink','розовый');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'white','белый');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'mixed','разноцветный');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'development sample: soft pink roses.','демонстрационный букет из нежно-розовых роз.');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'development sample: a white arrangement.','демонстрационная композиция в белых тонах.');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'development sample: pink tulips.','демонстрационный букет из розовых тюльпанов.');
--> statement-breakpoint
UPDATE products SET search_text=replace(search_text,'development sample: a colorful mixed bouquet.','демонстрационный яркий сборный букет.');
--> statement-breakpoint
UPDATE products SET search_text = replace(replace(replace(search_text,'development sample','демонстрационный букет'),'arrangement','композиция'),'private draft','личный черновик');
