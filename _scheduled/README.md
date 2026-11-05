# ブログの更新

`blog-source.html` がデザイン・記事本文・AI制作物紹介の編集元です。生成済みの index.html だけを直接編集しないでください。

`python3 _scheduled/publish.py` で公開時刻を過ぎた記事を追加し、index.html、article-*.html、sitemap.xml、配信用 _site を生成します。予約記事は posts.json の日本時間付き公開日時に従います。未公開記事は公開用ファイルやサイトマップに含みません。

記事URLは article-ID.html です。既存の #article-ID リンクは対応ページへ転送します。記事・画像を削除せず、公開済みの記事を保持して再生成します。GitHub Actions は生成したページと編集元をまとめて保存して公開します。

`article-seo.json` には記事IDごとの `published_time` を設定します。任意の `title`・`description` を指定すると、見出しや一覧の文章を変えずにページのSEOタイトル・説明とOGPへ反映できます。省略時は既存どおり記事タイトルと抜粋を使います。

## 記事26・27の時間指定公開

- 記事26: `article-domain-acquisition-guide.html`、2026-11-05 13:00 JST（04:00 UTC）。
- 記事27: `article-domain-connection-guide.html`、2026-11-06 09:00 JST（00:00 UTC）。
- 原稿は `_scheduled/article26.html`・`article27.html`。このディレクトリは配信用 `_site` にコピーしません。予約時刻より前には完成ページをリポジトリ直下へ追加しないでください。公開リポジトリの原稿ソース自体のアクセス権を制御する仕組みではありません。
- `posts.json` のタイムゾーン付き日時を比較し、到達した記事だけを生成します。未来の記事が古い出力に残っていても配信対象から除外します。処理は繰り返しても重複しません。
- `series-links.json` は実際に生成対象となった記事間だけにシリーズリンクを追加します。公開前の27へのリンクは出力しません。
- GitHub Actions は指定UTC時刻とその後の再試行時刻に起動します。cron実行、ビルド、Pagesデプロイ、CDNキャッシュには遅延があり、指定時刻ちょうどの閲覧開始は保証できません。従来の07:00 JSTの実行も維持します。
- デプロイ後に `scripts/verify_scheduled_publication.py` が本番のHTTP状態・一覧・サイトマップ・シリーズリンク・SEOを再試行付きで検証します。公開前は正式URLと原稿URLの404/410を要求します。
- Actionsのジョブ概要と `publication-observations-<run_id>` アーティファクトに予定日時・本番観測日時を別々に記録します。`first_verified_at` は初回確認時刻で、実際に閲覧可能になった瞬間の保証ではありません。検証失敗を予約／公開成功とは扱わないでください。

回帰試験: `python3 -m unittest discover -s tests -v`。実原稿を使った作業用コピーで、直前・ちょうどの時刻・27公開後・再実行を検証します。

## 移行済みサービスへの紹介リンク

制作物カードと記事内の起動リンクはBTS=bts.foremira.com、九九=kuku.foremira.com、ドリル=drill.foremira.com、旅行=trip.foremira.comを使う。publish.pyは生成元と予約記事を取り込んだ後、および出力時に既知の旧起動URLを補正する。query/hashを保持し、記事本文の過去の記述・画像・日付は置き換えない。URLそのものを表示しているリンクは表示文字も新URLに揃える。

旧originの記録救出・復元・印刷ページは保存領域を使うため、九九/ドリルは起動用のroot/index.htmlだけを補正対象にする。専用救出ページの旧URLは維持する。テストバトンのリンクや公開状態はこの補正の対象外。
