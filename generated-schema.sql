-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: PostgreSQL
-- Generated at: 2025-09-29T13:58:21.456Z

CREATE TABLE "todo" (
  "id" SERIAL PRIMARY KEY,
  "title" text NOT NULL,
  "due_date" date,
  "done_flag" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "deleted_at" timestamp
);

CREATE TABLE "audit_log" (
  "id" SERIAL PRIMARY KEY,
  "todo_id" integer NOT NULL,
  "action" text NOT NULL,
  "old_values" text,
  "new_values" text,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "user" (
  "user_id" varchar(256) PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "position" text,
  "photo_url" text,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "user_app" (
  "id" SERIAL PRIMARY KEY,
  "user_id" varchar(256) NOT NULL,
  "app_name" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "user_role" (
  "id" SERIAL PRIMARY KEY,
  "user_id" varchar(256) NOT NULL,
  "app_name" text NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "team_structure_page" (
  "id" SERIAL PRIMARY KEY,
  "page_name" text NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "chart_data" jsonb NOT NULL DEFAULT ({"nodes": [], "edges": []}),
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

COMMENT ON TABLE "todo" IS 'TODOアイテムを管理するメインテーブル';

COMMENT ON COLUMN "todo"."title" IS 'TODOのタイトル';

COMMENT ON COLUMN "todo"."due_date" IS '期限日（オプション）';

COMMENT ON COLUMN "todo"."done_flag" IS '完了フラグ';

COMMENT ON COLUMN "todo"."created_at" IS '作成日時';

COMMENT ON COLUMN "todo"."updated_at" IS '更新日時';

COMMENT ON COLUMN "todo"."deleted_at" IS '削除日時（論理削除）';

COMMENT ON TABLE "audit_log" IS 'TODO操作の監査ログを記録';

COMMENT ON COLUMN "audit_log"."todo_id" IS '対象TODO ID';

COMMENT ON COLUMN "audit_log"."action" IS 'アクション種別: CREATE, UPDATE, TOGGLE, DELETE';

COMMENT ON COLUMN "audit_log"."old_values" IS '変更前の値（JSON文字列）';

COMMENT ON COLUMN "audit_log"."new_values" IS '変更後の値（JSON文字列）';

COMMENT ON COLUMN "audit_log"."created_at" IS '監査ログ作成日時';

COMMENT ON TABLE "user" IS 'ユーザー情報を管理';

COMMENT ON COLUMN "user"."user_id" IS 'ユーザー識別子';

COMMENT ON COLUMN "user"."name" IS 'ユーザー名';

COMMENT ON COLUMN "user"."email" IS 'メールアドレス';

COMMENT ON COLUMN "user"."position" IS '役職';

COMMENT ON COLUMN "user"."photo_url" IS 'プロフィール写真URL';

COMMENT ON COLUMN "user"."created_at" IS 'ユーザー作成日時';

COMMENT ON COLUMN "user"."updated_at" IS 'ユーザー更新日時';

COMMENT ON TABLE "user_app" IS 'ユーザーとアプリケーションの関連付け';

COMMENT ON COLUMN "user_app"."user_id" IS 'ユーザー識別子';

COMMENT ON COLUMN "user_app"."app_name" IS 'アプリケーション名';

COMMENT ON COLUMN "user_app"."created_at" IS 'アプリ関連付け作成日時';

COMMENT ON TABLE "user_role" IS 'ユーザーのアプリケーション内でのロール管理';

COMMENT ON COLUMN "user_role"."user_id" IS 'ユーザー識別子';

COMMENT ON COLUMN "user_role"."app_name" IS 'アプリケーション名';

COMMENT ON COLUMN "user_role"."role" IS 'ロール名';

COMMENT ON COLUMN "user_role"."created_at" IS 'ロール割り当て作成日時';

COMMENT ON TABLE "team_structure_page" IS 'チーム構造ページの設定とデータ';

COMMENT ON COLUMN "team_structure_page"."page_name" IS 'ページ名';

COMMENT ON COLUMN "team_structure_page"."description" IS 'ページの説明';

COMMENT ON COLUMN "team_structure_page"."is_active" IS 'ページの有効/無効状態';

COMMENT ON COLUMN "team_structure_page"."chart_data" IS '組織図データ（JSON）';

COMMENT ON COLUMN "team_structure_page"."created_at" IS 'ページ作成日時';

COMMENT ON COLUMN "team_structure_page"."updated_at" IS 'ページ更新日時';

ALTER TABLE "audit_log" ADD FOREIGN KEY ("todo_id") REFERENCES "todo" ("id") ON DELETE CASCADE;

ALTER TABLE "user_app" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;

ALTER TABLE "user_role" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;
