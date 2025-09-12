-- Add user_id column without NOT NULL constraint first
ALTER TABLE "users" ADD COLUMN "user_id" varchar(256);

-- Update existing users with default user_id values based on their ID
UPDATE "users" SET "user_id" = 'user_' || id::text WHERE "user_id" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "user_id" SET NOT NULL;