"""Observe live publication separately from the scheduled article timestamp."""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://blog.foremira.com/'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links = []
        self.meta = {}
        self.time = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            self.links.append(attrs.get('href'))
        if tag == 'meta':
            self.meta[attrs.get('name') or attrs.get('property')] = attrs.get('content')
        if tag == 'time' and self.time is None:
            self.time = attrs.get('datetime')


def fetch(path):
    request = Request(BASE + path, headers={'User-Agent': 'Foremira-Publication-Check/1.0', 'Cache-Control': 'no-cache'})
    try:
        with urlopen(request, timeout=25) as response:
            return response.status, response.read().decode('utf-8')
    except HTTPError as error:
        return error.code, ''


def observe():
    now = datetime.now(timezone.utc)
    posts = json.loads((ROOT / '_scheduled/posts.json').read_text())
    targets = [post for post in posts if post.get('number') in (26, 27)]
    seo = json.loads((ROOT / '_scheduled/article-seo.json').read_text())
    home_status, home = fetch('')
    map_status, sitemap = fetch('sitemap.xml')
    if home_status != 200 or map_status != 200:
        raise RuntimeError('Home or sitemap is not reachable')
    results = []
    for post in targets:
        due = datetime.fromisoformat(post['publish_at'])
        status, source = fetch(post['id'] + '.html')
        visible = now >= due
        row = {'article': post['number'], 'url': BASE + post['id'] + '.html', 'scheduled_at': post['publish_at'], 'observed_at': now.isoformat(), 'http_status': status, 'expected_visible': visible}
        if visible:
            parsed = Page(source)
            expected = seo[post['id']]
            row['ok'] = (status == 200 and post['id'] + '.html' in home and post['id'] + '.html' in sitemap and '<h1 class="post-title">' + expected['title'] + '</h1>' in source and parsed.meta.get('description') == expected['description'] and parsed.meta.get('og:url') == row['url'])
            if row['ok']:
                row['first_verified_at'] = now.isoformat()
                row['verification_delay_seconds'] = round((now - due).total_seconds())
        else:
            source_status, _ = fetch('_scheduled/' + post['html'])
            row['source_http_status'] = source_status
            row['ok'] = status in (404, 410) and source_status in (404, 410) and post['id'] not in home and post['id'] not in sitemap
        results.append(row)
    visible_ids = {post['id'] for post in targets if now >= datetime.fromisoformat(post['publish_at'])}
    visible_ids.add('article-foremira-domain')
    rules = json.loads((ROOT / '_scheduled/series-links.json').read_text())['links']
    for origin, destinations in rules.items():
        if origin not in visible_ids:
            continue
        status, source = fetch(origin + '.html')
        if status != 200:
            continue  # Already reported by the article visibility check.
        links = Page(source).links
        for target in destinations:
            present = target + '.html' in links
            if present != (target in visible_ids):
                raise RuntimeError('Series link visibility mismatch: ' + origin + ' -> ' + target)
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--attempts', type=int, default=10)
    args = parser.parse_args()
    report = {'records': [], 'error': None}
    try:
        for attempt in range(args.attempts):
            try:
                report['records'] = observe()
                report['error'] = None
                if all(row['ok'] for row in report['records']):
                    break
            except Exception as error:
                report['error'] = str(error)
            if attempt + 1 < args.attempts:
                time.sleep(20)
        report['ok'] = report['error'] is None and bool(report['records']) and all(row['ok'] for row in report['records'])
    finally:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        summary = os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:
            with open(summary, 'a') as output:
                output.write('## 予約公開の本番観測\n\n予定時刻と初回確認時刻は別々に記録します。初回確認時刻は閲覧可能になった瞬間の保証ではありません。\n\n```json\n' + json.dumps(report, ensure_ascii=False, indent=2) + '\n```\n')
    if not report.get('ok'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
