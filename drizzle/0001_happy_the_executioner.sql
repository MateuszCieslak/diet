CREATE TABLE `plan_meal_eaten` (
	`plan_meal_id` int NOT NULL,
	`user_key` varchar(32) NOT NULL,
	CONSTRAINT `plan_meal_eaten_plan_meal_id_user_key_pk` PRIMARY KEY(`plan_meal_id`,`user_key`)
);
--> statement-breakpoint
ALTER TABLE `plan_meal_eaten` ADD CONSTRAINT `plan_meal_eaten_plan_meal_id_plan_meals_id_fk` FOREIGN KEY (`plan_meal_id`) REFERENCES `plan_meals`(`id`) ON DELETE cascade ON UPDATE no action;