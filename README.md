# Simple TODO List Application

Next.js + TypeScript + PostgreSQL で構築されたシンプルなTODOリストアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: TailwindCSS, shadcn/ui
- **バックエンド**: tRPC
- **データベース**: PostgreSQL (Docker)
- **ORM**: Drizzle ORM
- **バリデーション**: Zod
- **テスト**: Vitest
- **実行環境**: ローカル開発（Node.js + Docker Compose）

## 主要機能

- ✅ TODO の作成（タイトル、期限日）
- ✅ TODO の一覧表示
- ✅ TODO の編集（タイトル、期限日の更新）
- ✅ TODO の完了/未完了の切り替え
- ✅ TODO の削除
- ✅ レスポンシブデザイン

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースの起動

```bash
docker-compose up -d
```

### 3. データベースマイグレーション

```bash
npm run db:generate
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で確認できます。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーの起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバーの起動
- `npm run lint` - ESLintによるコードチェック
- `npm run test` - Vitestによるテスト実行
- `npm run db:generate` - Drizzleマイグレーションファイル生成
- `npm run db:migrate` - データベースマイグレーション実行
- `npm run db:studio` - Drizzle Studioの起動
- `npm run db:drop` - データベーステーブルの削除

## データベース管理

### マイグレーション

スキーマを変更した場合：

```bash
# マイグレーションファイルを生成
npm run db:generate

# マイグレーションを適用
npm run db:migrate
```

### Drizzle Studio

データベースの内容をGUIで確認：

```bash
npm run db:studio
```

### スキーマのロールバック

スキーマのバージョン管理とロールバックは以下の方法で実行できます：

1. **手動ロールバック**: downマイグレーションファイルを作成
2. **バックアップからの復元**: マイグレーション前のデータベースバックアップを使用
3. **Gitブランチ管理**: 機能ブランチでスキーマ変更を管理

## プロジェクト構造

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/trpc/       # tRPC API エンドポイント
│   │   ├── globals.css     # グローバルスタイル
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── page.tsx        # メインページ
│   ├── components/         # Reactコンポーネント
│   │   ├── ui/            # shadcn/ui コンポーネント
│   │   ├── TodoForm.tsx   # TODO作成フォーム
│   │   ├── TodoItem.tsx   # TODO項目コンポーネント
│   │   └── TodoList.tsx   # TODOリストコンポーネント
│   ├── lib/               # ユーティリティ
│   │   ├── trpc/         # tRPC クライアント設定
│   │   └── validations.ts # Zodバリデーションスキーマ
│   ├── server/            # サーバーサイドコード
│   │   ├── api/          # tRPC ルーター
│   │   └── db/           # データベース設定・スキーマ
│   └── __tests__/        # テストファイル
├── drizzle/              # マイグレーションファイル
├── docker-compose.yml    # PostgreSQL設定
├── drizzle.config.ts     # Drizzle設定
└── vitest.config.ts      # テスト設定
```

## 環境変数

`.env.local` ファイルに以下を設定：

```env
DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todo_db"
```