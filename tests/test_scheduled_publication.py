"""Boundary, direct-URL, series-link and idempotency checks in disposable copies."""
from datetime import datetime
import hashlib
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('scheduled_publisher', ROOT / '_scheduled/publish.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class ScheduledPublicationTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'blog'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('.git', '_site', '__pycache__'))

    def build(self, instant):
        clock = datetime.fromisoformat(instant)
        publisher.publish(self.root, clock)
        publisher.build_site(self.root, clock)
        return self.root / '_site'

    def test_release_boundaries_and_conditional_series_links(self):
        one = 'article-domain-acquisition-guide'
        two = 'article-domain-connection-guide'
        cases = [('2026-11-05T03:59:59+00:00', False, False), ('2026-11-05T04:00:00+00:00', True, False), ('2026-11-05T23:59:59+00:00', True, False), ('2026-11-06T00:00:00+00:00', True, True)]
        for instant, first, second in cases:
            with self.subTest(instant=instant):
                # A stale standalone future file must never enter the artifact.
                (self.root / (two + '.html')).write_text('STALE FUTURE ARTICLE')
                site = self.build(instant)
                home = (site / 'index.html').read_text()
                sitemap = (site / 'sitemap.xml').read_text()
                self.assertEqual((site / (one + '.html')).exists(), first)
                self.assertEqual((site / (two + '.html')).exists(), second)
                for id, visible in [(one, first), (two, second)]:
                    self.assertEqual(id + '.html' in home, visible)
                    self.assertEqual(id + '.html' in sitemap, visible)
                self.assertFalse((site / '_scheduled').exists())
                article25 = (site / 'article-foremira-domain.html').read_text()
                self.assertEqual('href="' + one + '.html"' in article25, first)
                if first:
                    source = (site / (one + '.html')).read_text()
                    self.assertIn('href="article-foremira-domain.html"', source)
                    self.assertEqual('href="' + two + '.html"' in source, second)
                    self.assertIn('<time datetime="2026-11-05">', source)
                if second:
                    self.assertIn('href="' + one + '.html"', (site / (two + '.html')).read_text())
                before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in site.iterdir() if p.is_file()}
                self.build(instant)
                after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in site.iterdir() if p.is_file()}
                self.assertEqual(before, after)

    def test_naive_clock_rejected(self):
        with self.assertRaises(ValueError):
            publisher.publish(self.root, datetime(2026, 11, 5, 13))


if __name__ == '__main__':
    unittest.main()
