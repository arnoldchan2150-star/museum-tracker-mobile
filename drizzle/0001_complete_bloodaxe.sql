CREATE TABLE `cloud_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payload` longtext NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloud_backups_id` PRIMARY KEY(`id`),
	CONSTRAINT `cloud_backups_userId_unique` UNIQUE(`userId`)
);
