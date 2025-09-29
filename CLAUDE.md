# Claude Code Development Guide

このドキュメントは、Claude CodeでSimple TODO List Appを開発する際の重要な情報をまとめています。

## 参照すべきドキュメント

./AGENTS.md

## プロジェクト概要

**Simple TODO List App** - シンプルなTODO管理アプリケーション（title, due_date, done_flag のCRUD操作）

### 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui
- **バックエンド**: tRPC v10, Drizzle ORM
- **データベース**: PostgreSQL (Docker Container)
- **スキーマ管理**: DBML (Database Markup Language)
- **テスト**: Vitest
- **UI コンポーネント**: shadcn/ui, Lucide React Icons
- **バリデーション**: Zod

## 受け入れ条件

- コミット前に `npm run ci` を実行し、`npm run fmt`、`npm run typecheck`、`npm run lint`、`npm test -- --run` が全て成功すること。

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
      - '5432:5432'
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

# REQUIRED Pre-push validaiton ( Use these for quicker development cycles )
npm run check:all                             # Run all checks in fast mode
npm run lint:fast                             # ESLint with cache and auto-fix
npm run typecheck:fast                        # TypeScript with incremental and skipLibCheck
npm run build:fast                            # Build with telemetry disabled

### DBML スキーマ管理 (標準アプローチ)

```bash
# DBMLからSQL schema と TypeScript types を生成（推奨）
npm run generate

# 個別生成
npm run generate:sql       # PostgreSQL スキーマ生成（標準 dbml2sql ツール使用）
npm run generate:types     # TypeScript types のみ生成（軽量カスタムスクリプト）

# レガシー生成（非推奨 - Drizzle schema も生成する重いスクリプト）
npm run generate:legacy
```

### DBML ワークフロー（標準化）

**標準ツール使用**:
- 🏛️ **SQL 生成**: 公式 `@dbml/cli` の `dbml2sql` コマンド
- 🪶 **TypeScript 生成**: 軽量カスタムスクリプト（`@dbml/core` パーサー使用）
- 🎯 **Drizzle Schema**: 手動管理（既存を維持）

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
  title: '買い物',
  due_date: '2024-12-31', // optional
});

// 更新
todo.update.mutate({
  id: 1,
  title: '更新されたタイトル',
  due_date: '2024-12-31',
  done_flag: true,
});

// 削除
todo.delete.mutate({ id: 1 });

// 完了切り替え
todo.toggle.mutate({ id: 1 });
```

## データベーススキーマ

### DBML スキーマ定義

```dbml
// schema.dbml - データベース設計の単一情報源
Project "Simple TODO List App" {
  database_type: 'PostgreSQL'
}

Table todos {
  id serial [pk, increment]
  title text [not null, note: 'TODOのタイトル']
  due_date date [null, note: '期限日（オプション）']
  done_flag boolean [not null, default: false, note: '完了フラグ']
  created_at timestamp [not null, default: `now()`, note: '作成日時']
  updated_at timestamp [not null, default: `now()`, note: '更新日時']
  deleted_at timestamp [null, note: '削除日時（論理削除）']
}

// その他のテーブルとリレーション定義...
```

### 生成されるDrizzle Schema

```typescript
// src/server/db/schema.ts - DBMLから自動生成
export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  due_date: date('due_date'),
  done_flag: boolean('done_flag').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});
```

### 生成されるTypeScript Types

```typescript
// src/lib/types-generated.ts - DBMLから自動生成
export interface TodoType {
  id: number;
  title: string;
  due_date?: string | null;
  done_flag: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
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

## テストの書き方

- one test should consist of 3 parts, setup_state, given(action), then(expect).
- DO NOT contain multiple tests in one test. Bad case : setup_state1, given1, then1, given2, then2... In this case, this test should be splitted into two tests. So test1 is setup_state1, given1, then1.
test2 is setup_state2, given2, then2.
- statement coverage is necessary. Whenever statement is tested, this code line should marked by "//tested by <test name>"
```
if(conditionA)
{
    foo();
    return hoge; //tested by <test name>
}
```
- Avoid combination of condition so that every condition can be tested.
```
if(conditionA || conditionB)
{
     foo();
}
```
=>
```
if(conditionA)
{
     foo(); //tested by <test name A>
}
else if(conditionB)
{
     foo(); //tested by <test name B>
}
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

6. **Schema変更時のTypeScriptエラー**

   ```bash
   # スキーマ変更時は関連する全ての型定義を更新する必要がある
   # 以下のファイルの整合性を確認:
   # - src/server/db/schema.ts (Drizzle schema)
   # - src/lib/types.ts (Client types)
   # - src/lib/validations.ts (Zod schemas)
   # - src/server/repositories/*.ts (Repository interfaces)
   # - src/server/services/*.ts (Service layer mapping)
   # - src/components/**/*.tsx (UI components)

   # CRITICAL: MemoryUserRepository もPgUserRepositoryと同じinterfaceを実装する必要がある
   # データベース型(User, UserApp)とクライアント型(UserWithAppsAndRoles)を適切にマッピング
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
root/
├── schema.dbml                     # DBML スキーマ定義（データベース設計の単一情報源）
├── scripts/
│   └── generate-from-dbml.js      # DBML → Drizzle/TypeScript 生成スクリプト
├── src/
│   ├── app/
│   │   ├── page.tsx                    # メインページ
│   │   ├── layout.tsx                  # レイアウト（TRPCProvider）
│   │   ├── globals.css                 # TailwindCSS + shadcn/ui styles
│   │   └── api/trpc/[trpc]/route.ts   # tRPC API Route
│   ├── components/
│   │   ├── TodoForm.tsx               # TODO作成フォーム
│   │   ├── TodoList.tsx               # TODO一覧表示
│   │   ├── TodoItem.tsx               # 個別TODOアイテム
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── utils.ts                   # ユーティリティ関数
│   │   ├── validations.ts             # Zodスキーマ
│   │   ├── types-generated.ts         # 📄 自動生成：DBMLから生成されたTypeScript型定義
│   │   └── trpc/
│   │       ├── client.ts              # tRPC client
│   │       └── Provider.tsx           # tRPC Provider
│   ├── server/
│   │   ├── api/
│   │   │   ├── trpc.ts               # tRPC設定
│   │   │   ├── root.ts               # メインルーター
│   │   │   └── routers/
│   │   │       └── todo.ts           # TODO API router
│   │   └── db/
│   │       ├── index.ts              # データベース接続
│   │       └── schema.ts             # 📄 自動生成：DBMLから生成されたDrizzleスキーマ
│   └── __tests__/
│       └── todo.test.ts              # バリデーションテスト
```

## DBML ワークフロー

### 1. スキーマ変更時の手順

1. `schema.dbml` を編集（データベース設計の変更）
2. `npm run generate` を実行（自動生成）
3. マイグレーション実行（`npm run db:generate && npm run db:migrate`）
4. テスト・ビルド確認

### 2. 重要なルール

- ✅ **DBML が単一の情報源**: すべてのスキーマ変更は `schema.dbml` で行う
- ❌ **生成ファイルを直接編集禁止**: `schema.ts` や `types-generated.ts` は手動編集しない
- 🔄 **自動生成を信頼**: `npm run generate` で常に最新状態に同期
- 📝 **DBML でドキュメント化**: テーブル・カラムにコメント（`note:`）を記述

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

⚠️ **CRITICAL**: Before pushing any code or creating PRs, ALWAYS run these checks locally in EXACT order:

### 1. ESLint Check (REQUIRED - ZERO TOLERANCE)

```bash
npm run lint
```

- ❌ **MUST FIX ALL**: ESLint errors AND warnings
- ❌ **MUST REMOVE**: ALL unused imports/variables (createUserSchema, FormDescription, etc.)
- ❌ **MUST FOLLOW**: ALL project style guidelines
- ❌ **CHECK RULE**: @typescript-eslint/no-unused-vars is STRICT - no exceptions
- ❌ **VERIFY OUTPUT**: "✓ No ESLint warnings or errors" only
- ⛔ **FAILURE = DO NOT PROCEED**

**Common lint failures to check:**

- Unused imports: `import { createUserSchema } from "@/lib/validations"`
- Unused variables: Variables defined but not used
- Unused icon imports: `import { ChevronDown, Checkbox } from "lucide-react"`
- Missing return types on functions
- Incorrect import ordering or formatting

**CRITICAL**: Every import MUST be used, or ESLint will fail CI

### 2. TypeScript Type Check (REQUIRED - ZERO TOLERANCE)

```bash
npx tsc --noEmit
```

- ❌ **MUST RESOLVE ALL**: TypeScript compilation errors
- ❌ **MUST FIX**: Type safety violations, nullable types, type mismatches
- ❌ **MUST ENSURE**: All type annotations are correct
- ⛔ **FAILURE = DO NOT PROCEED**

### 3. Build Verification (REQUIRED - ZERO TOLERANCE)

```bash
npm run build
```

- ❌ **MUST BUILD**: Application builds without ANY errors
- ❌ **MUST PASS**: Next.js build process completely
- ❌ **ZERO BUILD WARNINGS** allowed in production builds
- ⛔ **FAILURE = DO NOT PROCEED**

### 4. Test Execution (REQUIRED - ZERO TOLERANCE)

```bash
npm run test
```

- ❌ **ALL TESTS MUST PASS**: No failing test cases allowed
- ❌ **NO BROKEN TESTS**: Fix or update tests if needed
- ⛔ **FAILURE = DO NOT PROCEED**

## 🚨 CRITICAL: MAIN BRANCH PROTECTION

### ⛔ **ABSOLUTE RULE: NEVER PUSH DIRECTLY TO MAIN**

- **ALWAYS work on feature branches** (feature/_, fix/_, hotfix/\*)
- **NEVER use `git push origin main`** - This is strictly forbidden
- **ALL changes must go through Pull Requests**
- **ONLY exception**: Critical hotfixes for broken main branch CI

⚠️ **MAIN BRANCH CI FAILURE = IMMEDIATE PRIORITY HOTFIX REQUIRED**

### Before ANY push to main branch:

```bash
# MANDATORY pre-push sequence (NO EXCEPTIONS):
npm run lint          # Must pass with zero errors/warnings
npx tsc --noEmit      # Must pass with zero TypeScript errors
npm run build         # Must complete successfully
npm run test          # All tests must pass
```

## CRITICAL: Exact CI Command Matching

**MANDATORY**: Run these EXACT same commands as CI runs locally:

```bash
# Step 1: Lint (EXACT CI command)
npm run lint

# Step 2: Type Check (EXACT CI command)
npx tsc --noEmit

# Step 3: Build (EXACT CI command)
npm run build

# Step 4: Tests (EXACT CI command)
npm run test
```

### ⛔ MAIN BRANCH FAILURE PREVENTION

- **NEVER push directly to main** - Use feature branches only
- **ALWAYS create Pull Requests** for code review and CI validation
- **NEVER bypass PR process** except for critical hotfixes
- **IMMEDIATELY FIX** any main branch CI failure (highest priority)
- **CREATE HOTFIX branch** for main branch CI failures

### 📋 CORRECT WORKFLOW:

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and validate locally
npm run lint && npx tsc --noEmit && npm run build && npm run test

# 3. Commit and push to feature branch
git add .
git commit -m "feat: your feature description"
git push -u origin feature/your-feature-name

# 4. Create Pull Request (never push to main directly)
gh pr create --title "Your PR Title" --body "Description"
```

## STRICT Pre-Push Workflow (MANDATORY)

1. 🔴 **STOP**: Run ALL checks below BEFORE any git operations
2. ✅ **LINT**: `npm run lint` → Fix ALL issues → Re-run until CLEAN
3. ✅ **TYPES**: `npx tsc --noEmit` → Fix ALL errors → Re-run until CLEAN
4. ✅ **BUILD**: `npm run build` → Fix ALL issues → Re-run until CLEAN
5. ✅ **TESTS**: `npm run test` → Fix ALL failures → Re-run until CLEAN
6. ✅ **COMMIT**: Only after ALL checks pass with ZERO issues
7. ✅ **PUSH**: Only after successful local validation
8. ✅ **PR**: Create only when confident ALL CI checks will pass

## Failure Handling (ZERO TOLERANCE POLICY)

- 🚫 **NEVER PUSH** if ANY check fails
- 🚫 **NEVER COMMIT** with failing checks
- 🚫 **NEVER CREATE PR** with known issues
- 🔄 **ALWAYS RE-RUN** all checks after ANY code changes
- 📝 **DOCUMENT FIXES** in commit messages
- ⚡ **FIX IMMEDIATELY** - Don't leave broken code

## Common TypeScript Fixes Required

- **Nullable Types**: Use proper null checking and type guards
- **Array Types**: Handle readonly vs mutable array types
- **Form Types**: Ensure Zod schemas match component interfaces
- **Import Types**: Remove unused imports immediately
- **Generic Types**: Properly constrain generic type parameters

## Emergency Override (NEVER USE)

❌ **NO EXCEPTIONS** - These checks are mandatory for ALL code
❌ **NO RUSH COMMITS** - Quality over speed always  
❌ **NO "FIX LATER"** - Fix now or don't commit

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
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
