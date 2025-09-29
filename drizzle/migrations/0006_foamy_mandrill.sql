CREATE TABLE "reporting_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" varchar(256) NOT NULL,
	"to_user_id" varchar(256) NOT NULL,
	"line_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reporting_lines_from_user_id_to_user_id_unique" UNIQUE("from_user_id","to_user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "chart_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "reporting_lines" ADD CONSTRAINT "reporting_lines_from_user_id_users_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_lines" ADD CONSTRAINT "reporting_lines_to_user_id_users_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;