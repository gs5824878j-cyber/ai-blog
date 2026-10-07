"""Publish due articles using their explicit timezone-aware release dates."""
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import shutil


def publish(root, now=None):
    now = now or datetime.now(timezone.utc)
    pending = root / '_scheduled'
    path = pending / 'blog-source.html'
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
    render_pages(root, result)
    return result != original



BASE_URL = 'https://gs5824878j-cyber.github.io/ai-blog/'


def render_pages(root, source):
    """Render the home cards, permanent article pages and canonical sitemap."""
    from html import escape, unescape
    article_re = re.compile(r'<details class="post" id="([^"]+)"><summary>(.*?)</summary><div class="post-body">(.*?)</div></details>', re.S)
    posts = list(article_re.finditer(source))
    if not posts or len(posts) != source.count('<details class="post"'):
        raise ValueError('Article structure changed; refusing partial output')
    ids = [m[1] for m in posts]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate article IDs')
    def plain(value):
        return unescape(re.sub(r'<[^>]+>', '', value)).strip()
    def links(value, on_article=False):
        for id in ids:
            value = value.replace('href="#' + id + '"', 'href="' + id + '.html"')
        if on_article:
            for anchor in ('journal', 'ai-works', 'about', 'privacy', 'work-kuku'):
                value = value.replace('href="#' + anchor + '"', 'href="index.html#' + anchor + '"')
            value = value.replace('href="#"', 'href="index.html"')
        return value
    css = """<style id="permanent-article-layout">
.post-card{display:block;padding:30px 34px}.post-card:hover{background:#edf3e7}
.article-page{max-width:900px;padding-top:36px;padding-bottom:60px}
.article-back{display:inline-block;margin:0 0 24px;text-decoration:underline}
.article-heading{padding:30px 34px;background:#edf3e7;border-bottom:1px solid var(--line)}
.article-heading h1{margin:0 0 14px}.article-heading .post-excerpt{margin-bottom:0}
.article-page .post-body{overflow-wrap:anywhere}.article-page img{max-width:100%;height:auto}
@media(max-width:700px){.post-card,.article-heading{padding:24px}.article-page{padding-top:24px}}
</style>"""
    head, body = source.split('</head>', 1)
    head = re.sub(r'<link[^>]+rel="canonical"[^>]*>', '', head)
    head += css
    shell = body[:body.index('<main')]
    footer = re.search(r'<footer>.*?</footer>', body, re.S)[0]
    sitemap_urls = [BASE_URL]
    for post in posts:
        id, summary, content = post[1], post[2], post[3]
        title = plain(re.search(r'<span class="post-title">(.*?)</span>', summary, re.S)[1])
        excerpt = plain(re.search(r'<span class="post-excerpt">(.*?)</span>', summary, re.S)[1])
        heading = summary[:summary.index('<span class="post-toggle">')]
        heading = re.sub(r'<span class="post-title">(.*?)</span>', r'<h1 class="post-title">\1</h1>', heading, flags=re.S)
        page_head = re.sub(r'<title>.*?</title>', '<title>' + escape(title) + ' | 40代のAI制作ノート</title>', head, flags=re.S)
        page_head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + escape(excerpt, quote=True) + '">', page_head)
        url = BASE_URL + id + '.html'
        page_head += '<link rel="canonical" href="' + url + '">'
        event = '<script>if(window.blogAnalyticsEnabled){gtag("event","article_open",'+json.dumps({'article_id':id,'article_title':title,'send_to':'G-NBJ7466KDJ'},ensure_ascii=False)+');}</script>'
        page = page_head + '</head>' + links(shell, True) + '<main id="main" class="wrap article-page"><a class="article-back" href="index.html#journal">← 記事一覧に戻る</a><article class="post" id="' + id + '"><div class="article-heading">' + heading + '</div><div class="post-body">' + content + '</div></article><a class="article-back" href="index.html#journal">← 記事一覧に戻る</a></main>' + footer + event + '</body></html>\n'
        (root / (id + '.html')).write_text(links(page, True), encoding='utf-8')
        sitemap_urls.append(url)
    def card(post):
        summary = post[2].replace('記事を読む ＋', '記事を読む →')
        summary = re.sub(r'<span class="when-open">.*?</span>', '', summary)
        return '<article class="post"><a class="post-card" href="' + post[1] + '.html">' + summary + '</a></article>'
    home = article_re.sub(card, source)
    # Keep head analytics; remove obsolete accordion handlers after the footer.
    home = home[:home.index('</footer>') + len('</footer>')]
    home = home.replace('</head>', css + '<link rel="canonical" href="' + BASE_URL + '"></head>', 1)
    redirects = json.dumps({id:id+'.html' for id in ids})
    home += '<script>const articleURLs=' + redirects + ';function routeOldArticle(){const url=articleURLs[location.hash.slice(1)];if(url)location.replace(url);}window.addEventListener("hashchange",routeOldArticle);routeOldArticle();</script></body></html>\n'
    (root / 'index.html').write_text(links(home), encoding='utf-8')
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join('  <url><loc>' + escape(url) + '</loc></url>\n' for url in sitemap_urls)
    (root / 'sitemap.xml').write_text(xml + '</urlset>\n', encoding='utf-8')


def build_site(root):
    site = root / '_site'
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    # Publish generated pages and existing root-level assets.
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

