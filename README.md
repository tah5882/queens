# Queens PWA

スマホ向けの日替わりQueensパズルです。Cloudflare Workers Static Assetsで配信でき、D1を設定した場合は端末IDごとに進捗を同期します。D1がない場合や通信できない場合も、`localStorage`だけでゲームを続けられます。

## ローカル開発

```bash
npm run dev
# http://localhost:4173
```

`npm test`でルールとWorker APIを、`npm run build`で`dist/`への静的ビルドを確認できます。

## Cloudflare Workersへデプロイ

1. Wranglerをインストールしてログインします。
2. D1を使う場合はデータベースを作成します。

   ```bash
   wrangler d1 create queens-db
   ```

3. 出力された`database_id`を使って、`wrangler.toml`内の`[[d1_databases]]`ブロックをコメント解除します。
4. テーブルを作成し、デプロイします。

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

D1を使わない場合は設定を変更せず、そのまま`npm run deploy`できます。APIはストレージ種別として`local`を返し、ブラウザ側の保存を正として扱います。

## データ設計

ランダム生成した匿名の端末ID、パズルの日付、盤面、経過時間、クリア状態だけを保存します。名前やメールアドレスなどの個人情報は収集しません。同じブラウザではD1経由で再読み込み後も続きを復元できます。
