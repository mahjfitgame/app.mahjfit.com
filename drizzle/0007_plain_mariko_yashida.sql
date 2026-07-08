CREATE INDEX `in__local_migrations_executed` ON `_local_migrations` (`lm_executed`);--> statement-breakpoint
CREATE INDEX `in__local_migrations_status` ON `_local_migrations` (`lm_status`);--> statement-breakpoint
CREATE INDEX `in_sync_queue_operation` ON `te_sync_queue` (`syq_operation`);