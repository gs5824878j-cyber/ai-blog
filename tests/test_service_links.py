"""Regression checks for migrated launch links and legacy storage recovery URLs."""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('blog_publish_links', ROOT / '_scheduled/publish.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)

class Anchors(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.current = None
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.current = {'attrs': dict(attrs), 'text': ''}; self.links.append(self.current)
    def handle_data(self, text):
        if self.current is not None: self.current['text'] += text
    def handle_endtag(self, tag):
        if tag == 'a': self.current = None

class ServiceLinkTest(unittest.TestCase):
    def test_launch_urls_preserve_queries_fragments_and_public_hotel_paths(self):
        cases = {
            '../kuku-sodate/?theme=forest#learn': 'https://kuku.foremira.com/?theme=forest#learn',
            'https://gs5824878j-cyber.github.io/kuku-sodate/': 'https://kuku.foremira.com/',
            '../bts-news-hub/?member=RM#news': 'https://bts.foremira.com/?member=RM#news',
            'https://gs5824878j-cyber.github.io/bts-news-hub/': 'https://bts.foremira.com/',
            'https://oyako-trip-ten.vercel.app/hotels/hf-hkd-01/?a=1&b=2#hotel': 'https://trip.foremira.com/hotels/hf-hkd-01/?a=1&b=2#hotel',
            'https://kimidake-doriru.vercel.app/?from=blog#parent': 'https://drill.foremira.com/?from=blog#parent',
        }
        for old, new in cases.items():
            with self.subTest(url=old): self.assertEqual(publisher.migrated_service_url(old), new)

    def test_history_attributes_and_old_recovery_origins_stay_intact(self):
        old = 'https://oyako-trip-ten.vercel.app/?a=1&b=2#hotel'
        source = '<p>当時のURL：' + old + '</p><code>&lt;a href="' + old + '"&gt;</code>'
        source += '<img src="old-screenshot.png" alt="旧URLの画面">'
        source += '<a data-href="' + old + '" onclick="if(a>0){example.href=\'keep\';}" href=\'' + old + '\'>使ってみる</a>'
        source += '<a href="https://gs5824878j-cyber.github.io/bts-news-hub/">https://gs5824878j-cyber.github.io/bts-news-hub/</a>'
        after = publisher.update_service_links(source); parser = Anchors(); parser.feed(after)
        self.assertIn('<p>当時のURL：' + old + '</p>', after)
        self.assertIn('<code>&lt;a href="' + old + '"&gt;</code>', after)
        self.assertIn('<img src="old-screenshot.png" alt="旧URLの画面">', after)
        first = parser.links[0]
        self.assertEqual(first['attrs']['href'], 'https://trip.foremira.com/?a=1&b=2#hotel')
        self.assertEqual(first['attrs']['data-href'], old)
        self.assertEqual(first['attrs']['onclick'], "if(a>0){example.href='keep';}")
        self.assertEqual(first['text'], '使ってみる')
        self.assertEqual(parser.links[1]['text'], 'https://bts.foremira.com/')
        self.assertEqual(after, publisher.update_service_links(after))
        for url in [
            'https://kimidake-doriru.vercel.app/migration/rescue.html#parent',
            'https://kimidake-doriru.vercel.app/print.html',
            'https://gs5824878j-cyber.github.io/kuku-sodate/migration.html',
            'https://gs5824878j-cyber.github.io/foremira-data-migration/kuku/',
            'https://oyako-trip-ten.vercel.app.example.invalid/',
            'https://kaihatsusha-tsunagu-v4-test.vercel.app/',
            'https://store.line.me/stickershop/product/123/ja',
        ]:
            with self.subTest(unchanged=url): self.assertEqual(publisher.migrated_service_url(url), url)

if __name__ == '__main__': unittest.main()
