CREATE TABLE `order_cancellations` (
	`order_id` text PRIMARY KEY NOT NULL,
	`reason` text NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`actor_email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`);--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`order_id` text,
	`rating` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `catalog_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_reviews_customer_product_unique` ON `product_reviews` (`customer_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_reviews_product_status_idx` ON `product_reviews` (`product_id`,`status`);--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`reason` text NOT NULL,
	`provider_reference` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `refunds_order_idx` ON `refunds` (`order_id`);--> statement-breakpoint
CREATE TABLE `shipping_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`free_above` integer,
	`estimated_days` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`country_code` text NOT NULL,
	`name` text NOT NULL,
	`rate_basis_points` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tax_rates_country_unique` ON `tax_rates` (`country_code`);--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tax_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_method` text DEFAULT 'lorem-standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `idempotency_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);