# DataHarvestMCP 仕様書

## プロジェクト概要

Webサイトの更新チェックを自動化するMCPサーバーとNext.js管理画面をSQLiteで統合したプロジェクト。

### 目的

- Webサイトの更新チェックを自動化
- AIを活用した柔軟な変更検知分析

### 利用範囲

- 個人利用
- 生成AI (MCP経由での連携)

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| ランタイム | Node.js |
| MCP Server | TypeScript + `@modelcontextprotocol/sdk` |
| Admin UI | Next.js (App Router, Tailwind CSS) |
| Database | SQLite |
| ORM | Prisma v7 |

## プロジェクト構成

```
DataHarvestMCP/
├── packages/
│   ├── db/                    # Prismaスキーマ、SQLite接続
│   │   ├── prisma/
│   │   │   └── schema.prisma  # DBスキーマ定義
│   │   └── index.ts           # 共有DBクライアント (PrismaClient)
│   ├── admin-ui/             # Next.js管理画面
│   │   └── app/
│   │       └── page.tsx     # メイン画面
│   └── mcp-server/          # MCPサーバー
│       └── index.ts         # ツール定義・ハンドラ
├── docs/
│   └── spec.md              # 本ファイル
├── AGENTS.md                # 開発指示
└── README.md               # 概要
```

## データベーススキーマ

### Site

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | Int (PK) | 連番 |
| title | String | サイトタイトル |
| url | String | 監視対象URL |
| instruction | String | AIへの指示 |
| lastCheckedAt | DateTime? | 最終チェック日時 |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### UpdateLog

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | Int (PK) | 連番 |
| siteId | Int (FK) | 紐づくSite |
| hasChange | Boolean | 変更有無 |
| summary | String | 要約 |
| fullContent | String? | 取得_content (過去比較用) |
| createdAt | DateTime | 作成日時 |

## 提供されるツール (MCP)

| ツール名 | 説明 |
|--------|------|
| `get_target_sites` | 監視対象のWebsitesリストを取得 |
| `scrape_site_content` | 指定URLのHTML取得・テキスト抽出 |
| `save_update_log` | Webサイトのチェック結果をDBに保存 |

## 巡回フロー

1. `get_target_sites` でDBから監視対象リスト取得
2. 各サイトに対して `scrape_site_content` でHTML取得
3. 前回の `fullContent` と比較し、`hasChange` を判定
4. `save_update_log` で結果をDBに保存
5. 要約を返却