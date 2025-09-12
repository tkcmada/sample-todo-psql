# Claude Code Development Guide

このドキュメントは、Claude CodeでSimple TODO List Appを開発する際の重要な情報をまとめています。

## プロジェクト概要

**Simple TODO List App** - シンプルなTODO管理アプリケーション（title, due_date, done_flag のCRUD操作）

### 技術スタック
- **フロントエンド**: Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui
- **バックエンド**: tRPC v10, Drizzle ORM
- **データベース**: PostgreSQL (Docker Container)
- **テスト**: Vitest
- **UI コンポーネント**: shadcn/ui, Lucide React Icons
- **バリデーション**: Zod

## 環境設定

### 環境変数 (.env.local)
```env
DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todo_db"
```

### Docker 設定
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    container_name: todo_postgres
    environment:
      POSTGRES_USER: todo_user
      POSTGRES_PASSWORD: todo_password
      POSTGRES_DB: todo_db
    ports:
      - "5432:5432"
```

## 開発コマンド

### 基本的な開発フロー
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# Linting
npm run lint
```

### データベース操作
```bash
# Docker PostgreSQL起動
docker-compose up -d

# Drizzle マイグレーション生成
npm run db:generate

# データベースにスキーマ適用
npm run db:migrate

# Drizzle Studio（データベースGUI）
npm run db:studio

# テーブル削除
npm run db:drop
```

## API 構成

### tRPC Router: todo
- `todo.getAll` - TODO一覧取得（作成日時降順）
- `todo.create` - TODO作成
- `todo.update` - TODO更新
- `todo.delete` - TODO削除
- `todo.toggle` - TODO完了状態切り替え

### リクエスト/レスポンス例
```typescript
// 作成
todo.create.mutate({
  title: "買い物",
  due_date: "2024-12-31" // optional
})

// 更新
todo.update.mutate({
  id: 1,
  title: "更新されたタイトル",
  due_date: "2024-12-31",
  done_flag: true
})

// 削除
todo.delete.mutate({ id: 1 })

// 完了切り替え
todo.toggle.mutate({ id: 1 })
```

## データベーススキーマ

### todos テーブル
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  due_date DATE,
  done_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Drizzle Schema
```typescript
// src/server/db/schema.ts
export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  due_date: date('due_date'),
  done_flag: boolean('done_flag').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

## バリデーションスキーマ

### Zod Schemas
```typescript
// src/lib/validations.ts
export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  due_date: z.string().optional().nullable(),
});

export const updateTodoSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255).optional(),
  due_date: z.string().optional().nullable(),
  done_flag: z.boolean().optional(),
});

export const deleteTodoSchema = z.object({
  id: z.number(),
});

export const toggleTodoSchema = z.object({
  id: z.number(),
});
```

## トラブルシューティング

### よくある問題

1. **Database connection error (ECONNREFUSED)**
   ```bash
   # PostgreSQLコンテナが起動していない
   docker-compose up -d
   
   # 環境変数が読み込まれていない
   source .env.local
   # または
   npx dotenv -e .env.local npm run db:migrate
   ```

2. **"relation todos does not exist"**
   ```bash
   # マイグレーションが実行されていない
   npm run db:migrate
   ```

3. **Drizzle Kit deprecated commands**
   ```bash
   # 新しいコマンド形式を使用
   npm run db:generate  # (dotenv-cli付き)
   npm run db:migrate   # (dotenv-cli付き)
   ```

4. **WSL2でのDocker権限エラー**
   ```bash
   sudo usermod -aG docker $USER
   # 新しいシェルセッションを開始
   ```

5. **Windows側からのアクセス**
   ```
   # WSL2では通常 localhost:3000 で自動フォワーディング
   http://localhost:3000
   
   # うまくいかない場合はWSL IPを確認
   ip addr show eth0
   ```

### デバッグ方法
```bash
# データベース接続確認
docker exec -it todo_postgres psql -U todo_user -d todo_db -c "\l"

# テーブル一覧確認
docker exec -it todo_postgres psql -U todo_user -d todo_db -c "\dt"

# tRPC エラーは開発者ツールのConsoleで確認
```

## ファイル構造

```
src/
├── app/
│   ├── page.tsx                    # メインページ
│   ├── layout.tsx                  # レイアウト（TRPCProvider）
│   ├── globals.css                 # TailwindCSS + shadcn/ui styles
│   └── api/trpc/[trpc]/route.ts   # tRPC API Route
├── components/
│   ├── TodoForm.tsx               # TODO作成フォーム
│   ├── TodoList.tsx               # TODO一覧表示
│   ├── TodoItem.tsx               # 個別TODOアイテム
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── utils.ts                   # ユーティリティ関数
│   ├── validations.ts             # Zodスキーマ
│   └── trpc/
│       ├── client.ts              # tRPC client
│       └── Provider.tsx           # tRPC Provider
├── server/
│   ├── api/
│   │   ├── trpc.ts               # tRPC設定
│   │   ├── root.ts               # メインルーター
│   │   └── routers/
│   │       └── todo.ts           # TODO API router
│   └── db/
│       ├── index.ts              # データベース接続
│       └── schema.ts             # Drizzleスキーマ
└── __tests__/
    └── todo.test.ts              # バリデーションテスト
```

# Safety / Permissions

## Always allowed
- Web Search commands
- File read: `find`, `open`, `read`, `ls`
- File edit: `edit`, `new`
- Git safe: `git status`, `git diff`, `git add -p`, `git add`
- Node/TS: `npm install`, `npm build`, `npm test`, `npm run lint`, `node ./scripts/*`
- GitHub CLI: `gh pr view`, `gh issue list`, `gh pr status`
- Adding dependencies (`npm install <pkg>`)
- Docker operations: `docker ps`, `docker-compose up -d`

## Ask before
- Modifying CI config, `.env`, secrets
- Removing files
- git write `git commit`, `git push`
- Force-push or branch delete
- Other time consuming commands

## MANDATORY Pre-Push Checks

⚠️ **CRITICAL**: Before pushing any code or creating PRs, ALWAYS run these checks locally:

### 1. ESLint Check
```bash
npm run lint
```
- Fix ALL ESLint errors and warnings
- Remove unused imports/variables
- Ensure code follows project style guidelines

### 2. Type Check  
```bash
npm run build
# or
npx tsc --noEmit
```
- Resolve ALL TypeScript errors
- Ensure type safety across the codebase

### 3. Test Execution
```bash
npm run test
```
- All tests must pass
- No failing test cases allowed

### 4. Build Verification
```bash
npm run build
```
- Ensure the application builds successfully
- No build errors or warnings

## Pre-Push Workflow
1. ✅ Run `npm run lint` and fix all issues
2. ✅ Run `npm run test` and ensure all tests pass  
3. ✅ Run `npm run build` and verify successful build
4. ✅ Stage and commit changes
5. ✅ Push to remote branch
6. ✅ Create PR only after all checks pass

## Failure Handling
- If any check fails, DO NOT push code
- Fix all issues before proceeding
- Re-run all checks after fixes
- Update this file if new check requirements are added

## 注意事項

1. **環境変数管理**
   - dotenv-cli を使用して .env.local から自動読み込み
   - package.json スクリプトに組み込み済み

2. **Drizzle Kit v0.21+**
   - 新しいコマンド形式を使用（generate:pg → generate）
   - dialect: 'postgresql', url プロパティ使用

3. **tRPC v10**
   - React Query v4 との統合
   - App Router 対応済み

4. **Docker 設定**
   - WSL2 でのユーザー権限設定が必要
   - Docker Desktop for Windows 推奨

5. **UI コンポーネント**
   - shadcn/ui + TailwindCSS
   - レスポンシブデザイン対応
   - Lucide React アイコン使用

## パッケージバージョン

### Dependencies
- Next.js: ^14.2.5
- React: ^18.3.1
- tRPC: ^10.45.2
- Drizzle ORM: ^0.33.0
- Zod: ^3.23.8
- TailwindCSS: ^3.4.9

### Dev Dependencies
- TypeScript: ^5.5.4
- Drizzle Kit: ^0.24.2
- dotenv-cli: ^10.0.0
- Vitest: ^2.0.5

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Zod Documentation](https://zod.dev/)

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.