# DataHarvestMCP

Webサイトの更新チェックを自動化するMCPサーバーとNext.js管理画面をSQLiteで統合したプロジェクトです。

## 技術スタック

- **MCP Server**: Node.js (TypeScript) + `@modelcontextprotocol/sdk`
- **Admin UI**: Next.js (App Router, Tailwind CSS)
- **Database**: SQLite
- **ORM**: Prisma (v7)

## プロジェクト構造

```
DataHarvestMCP/
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

`http://localhost:3000` で管理画面にアクセスできます。監視対象のWebsitesを登録してください。

### MCPサーバー (stdio)

MCPクライアント（Claude Desktopなど）から以下のコマンドで起動します。

```bash
npx tsx /path/to/DataHarvestMCP/packages/mcp-server/index.ts
```

Claude Desktopの場合は `claude_desktop_config.json` に以下のように設定します:

```json
{
  "mcpServers": {
    "dataharvest-mcp": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/DataHarvestMCP/packages/mcp-server/index.ts"]
    }
  }
}
```

#### 提供されるツール

- `get_target_sites`: 監視対象のWebsitesリストを取得します。
- `scrape_site_content`: 指定したURLのHTMLを取得し、テキストを抽出します。
- `save_update_log`: Webサイトのチェック結果をDBに保存します。

## 開発ガイド

- スキーマを変更する場合は `packages/db/prisma/schema.prisma` を編集し、`npx prisma migrate dev` を実行してください。
- MCPサーバーのロジックは `packages/mcp-server/index.ts` にあります。