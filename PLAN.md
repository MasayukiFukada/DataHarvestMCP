# DataHarvestMCP 作業計画 (PLAN.md)

本プロジェクトを「Webサイト更新チェック自動化システム」として完成させるための計画や。
関西弁で失礼するで！

## 現状の把握
- [x] プロジェクトの雛形作成 (Next.js, Prisma, MCP SDK)
- [x] サンプル実装 (Person/FavoriteFood の管理)
- [ ] 本来の目的である「Webサイト更新チェック」のロジックは未着手

## 作業フェーズ

### Phase 1: データベース・モデリング (DB)
サンプルの「Person」とかを消して、サイト管理用のスキーマを定義するで。
- `Site`: 監視対象のURL、タイトル、AIへの指示（Prompt）を保持
- `UpdateLog`: AIが調べた結果（変化があったか、内容の要約など）を保持
- `prisma generate` とマイグレーションの実行

### Phase 2: MCPサーバの実装 (mcp-server)
AIが道具として使える「ツール」を実装していくわ。
- `get_target_sites`: DBから監視対象のサイト一覧を取得する
- `scrape_and_analyze_site`: 指定されたURLをスクレイピングして、ユーザーの指示に従って内容を分析する
- `save_analysis_result`: 分析した結果をDBに保存する
- スクレイピングライブラリ（`axios`, `cheerio` 等）の選定と導入

### Phase 3: Web UI の構築 (admin-ui)
人間がポチポチ設定したり結果を見たりする画面を作るで。
- サイト登録画面：URLと「何をチェックしてほしいか」を入力
- ダッシュボード：各サイトの最新状態と、過去の更新履歴を一覧表示
- Server Actions を使ったDB操作の実装

### Phase 4: アーキテクチャの整理 (Refactoring)
`AGENTS.md` にある通り、クリーンアーキテクチャを意識して整理する。
- `packages/db` や `packages/mcp-server` の中で、Domain, Application, Infrastructure に分ける
- ロジックのテストコード作成

### Phase 5: 動作確認と調整
- 実際に Claude などの AI から MCP 経由でツールを叩かせて、一連の流れ（巡回→分析→保存）が動くか確認する。
- エラーハンドリング（サイトが落ちてた時とか）の強化。

## 直近のタスク
1. `packages/db/prisma/schema.prisma` の更新
2. データベースのマイグレーション
3. MCPサーバへの基本ツールの雛形作成
