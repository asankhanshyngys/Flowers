-- Explicitly requested cart testing: enable only the four untouched example bouquets.
-- A one-time availability correction; preserve merchant-edited records.
UPDATE products
SET available = 1, version = version + 1, updated_at = '2026-09-17T09:15:00Z'
WHERE id IN ('rose-reverie', 'cloud-nine', 'tulip-daydream', 'garden-party')
  AND name LIKE '%(пример)' AND status = 'published' AND available = 0 AND version = 1;
