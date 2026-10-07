# ブログの更新

`blog-source.html` がデザイン・記事本文・AI制作物紹介の編集元です。生成済みの index.html だけを直接編集しないでください。

`python3 _scheduled/publish.py` で公開時刻を過ぎた記事を追加し、index.html、article-*.html、sitemap.xml、配信用 _site を生成します。予約記事は posts.json の日本時間付き公開日時に従います。未公開記事は公開用ファイルやサイトマップに含みません。

記事URLは article-ID.html です。既存の #article-ID リンクは対応ページへ転送します。記事・画像を削除せず、公開済みの記事を保持して再生成します。GitHub Actions は生成したページと編集元をまとめて保存して公開します。
