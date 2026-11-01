"""Offline tests: build copies only, never change the checkout or publish."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

class MigrationBuildTest(unittest.TestCase):
    def test_generated_urls_schedule_and_repeatability(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'blog'
            shutil.copytree(ROOT, root, ignore=shutil.ignore_patterns('.git', '_site', '__pycache__'))
            pending = root / '_scheduled/posts.json'
            posts = json.loads(pending.read_text())
            posts.append({'id': 'article-future-probe', 'publish_at': '2999-01-01T00:00:00+09:00', 'html': 'must-not-read.html'})
            pending.write_text(json.dumps(posts))
            (root / 'CNAME').write_text('blog.foremira.com\n')
            def build():
                subprocess.run(['python3', str(root / '_scheduled/publish.py')], check=True, capture_output=True)
                return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / '_site').iterdir() if p.is_file()}
            first = build()
            self.assertEqual(first, build())
            self.assertNotIn('article-future-probe', (root / '_site/index.html').read_text())
            self.assertEqual((root / '_site/CNAME').read_text(), 'blog.foremira.com\n')
            urls = [x.text for x in ET.parse(root / 'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
            articles = list((root / '_site').glob('article-*.html'))
            self.assertGreater(len(articles), 0)
            self.assertEqual(set(urls), {'https://blog.foremira.com/'} | {'https://blog.foremira.com/' + p.name for p in articles})
            for p in articles:
                html = p.read_text()
                self.assertIn('<link rel="canonical" href="https://blog.foremira.com/' + p.name + '">', html)
                self.assertIn('<meta property="og:url" content="https://blog.foremira.com/' + p.name + '">', html)
                self.assertNotIn('/ai-blog/favicon', html)
                self.assertNotIn('href="https://gs5824878j-cyber.github.io/ai-blog/', html)
                self.assertNotIn('href="../kuku-sodate/', html)
                self.assertNotIn('href="../bts-news-hub/', html)
            home = (root / '_site/index.html').read_text()
            for prop in ['og:type', 'og:url', 'og:title', 'og:description', 'og:image']:
                self.assertEqual(home.count('property="' + prop + '"'), 1)
            self.assertTrue((root / '_site/robots.txt').is_file())
            self.assertIn('Sitemap: https://blog.foremira.com/sitemap.xml', (root / '_site/robots.txt').read_text())

if __name__ == '__main__':
    unittest.main()
