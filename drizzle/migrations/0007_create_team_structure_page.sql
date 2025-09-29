-- Drop old reporting_lines table and related columns
DROP TABLE IF EXISTS "reporting_lines";
ALTER TABLE "users" DROP COLUMN IF EXISTS "chart_config";

-- Create team_structure_page table
CREATE TABLE "team_structure_page" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"chart_data" jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Insert a default page with sample data
INSERT INTO "team_structure_page" ("page_name", "description", "chart_data") VALUES 
('メインチーム体制図', 'メインのチーム体制図', '{"nodes": [], "edges": []}');