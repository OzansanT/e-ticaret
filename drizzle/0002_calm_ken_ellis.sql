CREATE TABLE `catalog_product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`label` text NOT NULL,
	`price` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `catalog_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_product_variants_sku_unique` ON `catalog_product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `catalog_product_variants_product_idx` ON `catalog_product_variants` (`product_id`,`active`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `variant_id` text REFERENCES catalog_product_variants(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `variant_sku` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `variant_label` text;--> statement-breakpoint
CREATE TRIGGER catalog_product_variants_stock_insert_guard
BEFORE INSERT ON catalog_product_variants
FOR EACH ROW WHEN NEW.stock < 0
BEGIN
  SELECT RAISE(ABORT, 'catalog product variant stock cannot be negative');
END;--> statement-breakpoint
CREATE TRIGGER catalog_product_variants_stock_update_guard
BEFORE UPDATE OF stock ON catalog_product_variants
FOR EACH ROW WHEN NEW.stock < 0
BEGIN
  SELECT RAISE(ABORT, 'catalog product variant stock cannot be negative');
END;
