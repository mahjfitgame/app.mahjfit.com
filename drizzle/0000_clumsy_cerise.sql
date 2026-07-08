CREATE TABLE `_local_migrations` (
	`lm_version` text PRIMARY KEY NOT NULL,
	`lm_name` text NOT NULL,
	`lm_executed` integer NOT NULL,
	`lm_sql_up` text,
	`lm_sql_down` text,
	`lm_checksum` text,
	`lm_status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `in__local_migrations_executed` ON `_local_migrations` (`lm_executed`);--> statement-breakpoint
CREATE INDEX `in__local_migrations_status` ON `_local_migrations` (`lm_status`);--> statement-breakpoint
CREATE TABLE `te_app_config` (
	`conf_key` text PRIMARY KEY NOT NULL,
	`conf_value` text NOT NULL,
	`conf_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `in_app_config_updated` ON `te_app_config` (`conf_updated`);--> statement-breakpoint
CREATE TABLE `te_app_state` (
	`as_key` text PRIMARY KEY NOT NULL,
	`as_value` text NOT NULL,
	`as_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `te_sync_meta` (
	`sym_key` text PRIMARY KEY NOT NULL,
	`sym_bootstrap_done` integer DEFAULT 0 NOT NULL,
	`sym_last_pulled` integer DEFAULT 0 NOT NULL,
	`sym_cursor` text,
	`sym_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `in_sync_meta_last_pulled` ON `te_sync_meta` (`sym_last_pulled`);--> statement-breakpoint
CREATE TABLE `te_sync_queue` (
	`syq_id` text PRIMARY KEY NOT NULL,
	`syq_operation` text NOT NULL,
	`syq_payload` text NOT NULL,
	`syq_status` text NOT NULL,
	`syq_retry_count` integer DEFAULT 0 NOT NULL,
	`syq_created` integer NOT NULL,
	`syq_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `in_sync_queue_status` ON `te_sync_queue` (`syq_status`);--> statement-breakpoint
CREATE INDEX `in_sync_queue_created` ON `te_sync_queue` (`syq_created`);