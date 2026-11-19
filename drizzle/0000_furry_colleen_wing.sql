CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`unit` varchar(8) NOT NULL,
	`category` varchar(32) NOT NULL,
	`kcal` decimal(7,2) NOT NULL,
	`protein` decimal(7,2) NOT NULL,
	`fat` decimal(7,2) NOT NULL,
	`carbs` decimal(7,2) NOT NULL,
	`hidden_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`amount` decimal(8,2) NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `meal_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_types` (
	`meal_id` int NOT NULL,
	`type` varchar(32) NOT NULL,
	CONSTRAINT `meal_types_meal_id_type_pk` PRIMARY KEY(`meal_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`photo_path` varchar(64),
	`preparation` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meals_id` PRIMARY KEY(`id`),
	CONSTRAINT `meals_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `plan_meal_exclusions` (
	`plan_meal_id` int NOT NULL,
	`user_key` varchar(32) NOT NULL,
	CONSTRAINT `plan_meal_exclusions_plan_meal_id_user_key_pk` PRIMARY KEY(`plan_meal_id`,`user_key`)
);
--> statement-breakpoint
CREATE TABLE `plan_meal_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_meal_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`amount` decimal(8,2) NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `plan_meal_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`position` int NOT NULL,
	`source_meal_id` int,
	`name` varchar(120) NOT NULL,
	`photo_path` varchar(64),
	`preparation` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredient_id` int,
	`name` varchar(120),
	`unit` varchar(8),
	`amount` decimal(10,2),
	`done_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `meal_ingredients` ADD CONSTRAINT `meal_ingredients_meal_id_meals_id_fk` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_ingredients` ADD CONSTRAINT `meal_ingredients_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_types` ADD CONSTRAINT `meal_types_meal_id_meals_id_fk` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_meal_exclusions` ADD CONSTRAINT `plan_meal_exclusions_plan_meal_id_plan_meals_id_fk` FOREIGN KEY (`plan_meal_id`) REFERENCES `plan_meals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_meal_ingredients` ADD CONSTRAINT `plan_meal_ingredients_plan_meal_id_plan_meals_id_fk` FOREIGN KEY (`plan_meal_id`) REFERENCES `plan_meals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_meal_ingredients` ADD CONSTRAINT `plan_meal_ingredients_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_meals` ADD CONSTRAINT `plan_meals_source_meal_id_meals_id_fk` FOREIGN KEY (`source_meal_id`) REFERENCES `meals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD CONSTRAINT `shopping_list_items_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `plan_meals_date_position_idx` ON `plan_meals` (`date`,`position`);