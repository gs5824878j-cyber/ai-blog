# FOREMIRA 移行準備

作業ブランチ prepare/foremira。本番反映は未承認。mainへのpush・merge、DNS/Pages/Auth設定変更は行わない。

全体の最新試験・URL対応・バックアップ・切り替え手順は `/workspace/foremira-migration/LATEST-PROGRESS.md` を参照。ブログ固有の結果は `/workspace/foremira-migration/blog-cutover-status.json` と `blog-url-map.csv`。

## ローカル回帰試験

`python3 -m unittest discover -s tests -v`
