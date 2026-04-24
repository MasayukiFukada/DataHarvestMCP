# DataHarvestMCP 作業計画 (PLAN.md)

本プロジェクトを「Website更新チェック自動化システム」として完成させるための計画や。
関西弁で失礼するで！

## 現状の把握
- [x] プロジェクトの雛形作成 (Next.js, Prisma, MCP SDK)
- [x] サンプル実装 (Person/FavoriteFood の管理)
- [x] Phase 1: DBスキーマ (Site, UpdateLog)
- [x] Phase 2: MCPサーバ & ツール実装
  - [x] `check_all_sites`: 全サイト巡回（HTML取得・変更検知・保存の定型作業）
  - [x] `get_target_sites`: サイト一覧取得
  - [x] `scrape_site_content`: 特定URLのHTML取得
  - [x] `save_update_log`: 手動でログ保存
- [ ] Phase 3-5: Web UI・整理・動作確認

## MCPツール一覧

| ツール名 | 用途 |
|----------|------|
| `check_all_sites` | **定型巡回**: 全サイトのHTML取得・変更検知・結果をDBに保存 |
| `get_target_sites` | 登録サイトの一覧取得 |
| `scrape_site_content` | 特定URLを詳しく見たい時 |
| `save_update_log` | 手動でメモ残しときたい時 |

## 作業フェーズ

### Phase 1: データベース・モデリング (DB)
- [x] Site: 監視対象のURL、タイトル、AIへの指示（Prompt）を保持
- [x] UpdateLog: AIが調べた結果（変化があったか、内容の要約など）を保持
- [x] prisma generate とマイグレーションの実行

### Phase 2: MCPサーバの実装 (mcp-server)
- [x] `check_all_sites`: 定型巡回ツール（HTML取得・変更検知・保存）
- [x] `get_target_sites`: DBから監視対象のサイト一覧を取得
- [x] `scrape_site_content`: 指定URLをスクレイピング
- [x] `save_update_log`: 分析結果をDBに保存
- [ ] スクレイピングの改善（cheerio等の導入）

### Phase 3: Web UI の構築 (admin-ui)
- サイト登録画面：URLと「何をチェックしてほしいか」を入力
- ダッシュボード：各サイトの最新状態と、過去の更新履歴を一覧表示
- Server Actions を使ったDB操作の実装

### Phase 4: アーキテクチャの整理 (Refactoring)
- `packages/db` や `packages/mcp-server` の中で、Domain, Application, Infrastructure に分ける
- ロジックのテストコード作成

### Phase 5: 動作確認と調整
- 実際に Claude などの AI から MCP 経由でツールを叩かせて確認
- エラーハンドリング（サイトが落ちてた時とか）の強化

## 直近のタスク
1. [ ] Phase 3: Web UI の構築
2. [ ] Phase 4: クリーンアーキテクチャへの整理
3. [ ] Phase 5: テストコード作成 & エラーハンドリング強化