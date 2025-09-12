ALTER TABLE "user_apps" DROP CONSTRAINT "user_apps_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_apps" ALTER COLUMN "user_id" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "user_id" SET DATA TYPE varchar(256);--> statement-breakpoint
-- First update foreign key references to use user_id values
UPDATE "user_apps" SET "user_id" = 'user_' || "user_id"::text WHERE "user_id" IS NOT NULL;--> statement-breakpoint
UPDATE "user_roles" SET "user_id" = 'user_' || "user_id"::text WHERE "user_id" IS NOT NULL;--> statement-breakpoint
-- Drop the old primary key constraint first
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";--> statement-breakpoint
ALTER TABLE "users" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
ALTER TABLE "user_apps" ADD CONSTRAINT "user_apps_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "id";