# TemplateMCP

AIが操作するモデルコンテキストプロトコル（MCP）サーバーと、人間が操作するNext.js管理画面をSQLiteで統合したテンプレートプロジェクトです。

## 技術スタック

- **MCP Server**: Node.js (TypeScript) + `@modelcontextprotocol/sdk`
- **Admin UI**: Next.js (App Router, Tailwind CSS)
- **Database**: SQLite
- **ORM**: Prisma (v7)

## プロジェクト構造

```
TemplateMCP/
├── packages/
│   ├── db/            # Prismaスキーマ、SQLite接続、共有DBクライアント
│   ├── admin-ui/      # Next.js管理画面
│   └── mcp-server/    # MCPサーバー (stdio)
├── AGENTS.md          # 開発指示
└── README.md          # 本ファイル
```

## セットアップ

### 1. 依存関係のインストール

ルートディレクトリで実行します。

```bash
npm install
```

### 2. データベースの初期化

```bash
cd packages/db
npx prisma migrate dev --name init
npm run postinstall # Prisma Clientの生成
```

## 実行方法

### 管理画面 (Next.js)

```bash
cd packages/admin-ui
npm run dev
```

`http://localhost:3000` で管理画面にアクセスできます。人物とその好物を登録してください。

### MCPサーバー (stdio)

MCPクライアント（Claude Desktopなど）から以下のコマンドで起動します。

```bash
npx tsx /path/to/TemplateMCP/packages/mcp-server/index.ts
```

geminiの場合はこんな感じで設定する

```
"mcpServers": {
  "template-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "tsx",
      "/home/minamo/repository/TemplateMCP/packages/mcp-server/index.ts"
    ]
  }
}
```

#### 提供されるツール

- `greet_and_suggest_all`: データベースに登録された全員に挨拶し、好物に基づいたメニューを提案します。
  - **新機能**: TheMealDB API と連携し、ユーザーの好みに合った実際の料理名を Web から取得して提案に含めます。和食、中華、イタリアンなどの主要なカテゴリに対応しています。

## 開発ガイド

- スキーマを変更する場合は `packages/db/prisma/schema.prisma` を編集し、`npx prisma migrate dev` を実行してください。
- MCPサーバーのロジックは `packages/mcp-server/index.ts` にあります。
