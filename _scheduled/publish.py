"""Publish due articles using their explicit timezone-aware release dates."""
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import shutil


def publish(root, now=None):
    now = now or datetime.now(timezone.utc)
    pending = root / '_scheduled'
    path = root / 'index.html'
    original = path.read_text(encoding='utf-8')
    result = original
    copies = []
    posts = json.loads((pending / 'posts.json').read_text(encoding='utf-8'))
    for post in sorted(posts, key=lambda p: datetime.fromisoformat(p['publish_at'])):
        due = datetime.fromisoformat(post['publish_at'])
        if due.tzinfo is None:
            raise ValueError('publish_at must specify a timezone')
        if now < due:
            continue
        marker = f'<details class="post" id="{post["id"]}">'
        if marker not in result:
            article = (pending / post['html']).read_text(encoding='utf-8').strip()
            if not article.startswith(marker):
                raise ValueError('Article ID mismatch')
            match = re.search(r'<details class="post" id="[^"]+">', result)
            if not match:
                raise ValueError('Could not locate article list; refusing to overwrite')
            result = result[:match.start()] + article + '\n' + result[match.start():]
            style_id = f'scheduled-style-{post["id"]}'
            css = (pending / post['css']).read_text(encoding='utf-8')
            if f'id="{style_id}"' not in result:
                result = result.replace('</head>', f'<style id="{style_id}">\n{css}</style>\n</head>', 1)
        for name in post.get('assets', []):
            if Path(name).name != name:
                raise ValueError('Asset must be a basename')
            data = (pending / name).read_bytes()
            target = root / name
            if target.exists() and target.read_bytes() != data:
                raise ValueError(f'Existing asset differs: {name}')
            copies.append((target, data))
    if result != original:
        count = len(re.findall(r'<details class="post" id="', result))
        result, changed = re.subn(r'全\d+記事', f'全{count}記事', result, count=1)
        if changed != 1:
            raise ValueError('Article count marker missing')
        result = result.replace('Ver.1.7', 'Ver.1.8')
        path.write_text(result, encoding='utf-8')
    for target, data in copies:
        target.write_bytes(data)
    for src in re.findall(r'<img[^>]+src="([^"]+)"', result):
        if '://' not in src and not src.startswith('data:') and not (root / src).is_file():
            raise ValueError(f'Missing image: {src}')
    return result != original


def build_site(root):
    site = root / '_site'
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    # Current blog uses a single HTML file and root-level images.
    allowed = {'.html', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.css', '.js', '.txt', '.xml'}
    for source in root.iterdir():
        if source.is_file() and not source.name.startswith(('.', '_')) and (source.suffix in allowed or source.name == 'CNAME'):
            shutil.copyfile(source, site / source.name)
    (site / '.nojekyll').touch()


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    changed = publish(root)
    build_site(root)
    print('Published due articles.' if changed else 'No new articles due; current site prepared.')
