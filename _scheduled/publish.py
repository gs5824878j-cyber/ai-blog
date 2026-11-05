"""Publish due articles using their explicit timezone-aware release dates."""
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import shutil
import sys
from html import escape, unescape
from urllib.parse import urljoin, urlsplit, urlunsplit
from zoneinfo import ZoneInfo
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from favicon import apply as apply_favicon


def migrated_service_url(value):
    """Resolve active service links; retain old storage-recovery/print pages."""
    decoded = unescape(value)
    resolved = urljoin('https://gs5824878j-cyber.github.io/ai-blog/', decoded) if decoded.startswith('../') else decoded
    url = urlsplit(resolved)
    if url.scheme not in ('', 'http', 'https') or url.username or url.password:
        return decoded
    hosts = {
        'oyako-trip-ten.vercel.app': 'trip.foremira.com',
        'kimidake-doriru.vercel.app': 'drill.foremira.com',
    }
    path = url.path or '/'
    host = hosts.get(url.hostname)
    if url.hostname == 'kimidake-doriru.vercel.app' and path not in ('/', '/index.html'):
        return decoded
    if url.hostname == 'gs5824878j-cyber.github.io':
        for project, domain in [('bts-news-hub', 'bts.foremira.com'), ('kuku-sodate', 'kuku.foremira.com')]:
            prefix = '/' + project
            if path == prefix or path.startswith(prefix + '/'):
                path = path[len(prefix):] or '/'
                if project == 'kuku-sodate' and path not in ('/', '/index.html'):
                    return decoded
                host = domain
                break
    if not host:
        return decoded
    return urlunsplit(('https', host, path, url.query, url.fragment))


def update_service_links(source):
    """Update anchor destinations and matching URL labels, not historical prose."""
    anchors = re.compile(r'''(?P<tag><a\b(?:[^"'>]|"[^"]*"|'[^']*')*>)(?P<label>.*?)(?P<close></a\s*>)''', re.I | re.S)
    attributes = re.compile(r'''\s+(?P<name>[^\s=<>/]+)(?:\s*=\s*(?:"(?P<double>[^"]*)"|'(?P<single>[^']*)'|(?P<bare>[^\s<>]+)))?''', re.S)

    def replace(match):
        tag, label = match['tag'], match['label']
        href = next((attr for attr in attributes.finditer(tag) if attr['name'].lower() == 'href'), None)
        if not href or all(href[group] is None for group in ('double', 'single', 'bare')):
            return match[0]
        group = next(group for group in ('double', 'single', 'bare') if href[group] is not None)
        old = unescape(href[group])
        new = migrated_service_url(old)
        if old == new:
            return match[0]
        tag = tag[:href.start(group)] + escape(new, quote=True) + tag[href.end(group):]
        if unescape(label.strip()) == old:
            label = label.replace(label.strip(), escape(new, quote=False), 1)
        return tag + label + match['close']

    return anchors.sub(replace, source)


def scheduled_posts(root):
    posts = json.loads((root / '_scheduled/posts.json').read_text(encoding='utf-8'))
    ids = [post['id'] for post in posts]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate scheduled article IDs')
    for post in posts:
        if not re.fullmatch(r'article-[a-z0-9-]+', post['id']):
            raise ValueError('Invalid scheduled article ID')
        if datetime.fromisoformat(post['publish_at']).tzinfo is None:
            raise ValueError('publish_at must specify a timezone')
    return sorted(posts, key=lambda post: datetime.fromisoformat(post['publish_at']))


def publication_time(now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError('Publication clock must specify a timezone')
    return now


def publish(root, now=None):
    now = publication_time(now)
    pending = root / '_scheduled'
    path = pending / 'blog-source.html'
    original = path.read_text(encoding='utf-8')
    result = apply_favicon(original)
    copies = []
    posts = scheduled_posts(root)
    for post in posts:
        due = datetime.fromisoformat(post['publish_at'])
        if due.tzinfo is None:
            raise ValueError('publish_at must specify a timezone')
        if now < due:
            # Also protect builds made from a checkout with stale future output.
            result = re.sub(r'<details class="post" id="' + re.escape(post['id']) + r'">.*?</details>\s*', '', result, flags=re.S)
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
            if post.get('css'):
                style_id = f'scheduled-style-{post["id"]}'
                css = (pending / post['css']).read_text(encoding='utf-8')
                if f'id="{style_id}"' not in result:
                    result = result.replace('</head>', f'<style id="{style_id}">\n{css}</style>\n</head>', 1)
        if post.get('work_html') and f'id="{post["work_id"]}"' not in result:
            work = (pending / post['work_html']).read_text(encoding='utf-8').strip()
            if f'id="{post["work_id"]}"' not in work:
                raise ValueError('Work ID mismatch')
            section = re.search(r'<section id="ai-works"[^>]*>.*?</section>', result, re.S)
            if not section:
                raise ValueError('AI works section missing')
            end = section.end() - len('</section>')
            result = result[:end] + work + result[end:]
        for name in post.get('assets', []):
            if Path(name).name != name:
                raise ValueError('Asset must be a basename')
            data = (pending / name).read_bytes()
            target = root / name
            if target.exists() and target.read_bytes() != data:
                raise ValueError(f'Existing asset differs: {name}')
            copies.append((target, data))
    result = update_service_links(result)
    numbers = re.findall(r'<span class="post-meta">記事\s+(\d+)', result)
    if len(numbers) != len(set(numbers)):
        raise ValueError('Article number conflict; refusing to overwrite')
    count = len(re.findall(r'<details class="post" id="', result))
    result, changed = re.subn(r'全\d+記事', f'全{count}記事', result, count=1)
    if changed != 1:
        raise ValueError('Article count marker missing')
    if result != original:
        result = result.replace('Ver.1.7', 'Ver.1.8')
        path.write_text(result, encoding='utf-8')
    for target, data in copies:
        target.write_bytes(data)
    for src in re.findall(r'<img[^>]+src="([^"]+)"', result):
        if '://' not in src and not src.startswith('data:') and not (root / src).is_file():
            raise ValueError(f'Missing image: {src}')
    render_pages(root, result)
    return result != original



BASE_URL = 'https://blog.foremira.com/'


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
        # Rewrite active self-links without changing historical URLs in article text.
        value = update_service_links(value)
        value = re.sub(
            r'href="https://gs5824878j-cyber\.github\.io/ai-blog/([^"]*)"',
            lambda match: 'href="' + (match[1] or 'index.html') + '"',
            value,
        )
        for id in ids:
            value = value.replace('href="#' + id + '"', 'href="' + id + '.html"')
        if on_article:
            for anchor in ('journal', 'ai-works', 'about', 'privacy', 'work-kuku', 'work-line-stickers'):
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
    seo_path = root / "_scheduled" / "article-seo.json"
    article_seo = json.loads(seo_path.read_text(encoding="utf-8")) if seo_path.exists() else {}
    series_path = root / '_scheduled/series-links.json'
    series = json.loads(series_path.read_text(encoding='utf-8')) if series_path.exists() else {}
    titles = {post[1]: plain(re.search(r'<span class="post-title">(.*?)</span>', post[2], re.S)[1]) for post in posts}
    for post in posts:
        id, summary, content = post[1], post[2], post[3]
        title = plain(re.search(r'<span class="post-title">(.*?)</span>', summary, re.S)[1])
        excerpt = plain(re.search(r'<span class="post-excerpt">(.*?)</span>', summary, re.S)[1])
        seo = article_seo.get(id, {})
        page_title = seo.get('title', title + ' | 40代のAI制作ノート')
        description = seo.get('description', excerpt)
        destinations = [target for target in series.get('links', {}).get(id, []) if target in ids]
        if destinations:
            section_id = 'series-' + id
            content += '<section class="related-articles" aria-labelledby="' + section_id + '"><h2 id="' + section_id + '">' + escape(series.get('title', '関連記事')) + '</h2><ul class="related-list">'
            content += ''.join('<li><a class="related-link" href="' + target + '.html"><span class="related-title">' + escape(titles[target]) + '</span></a></li>' for target in destinations)
            content += '</ul></section>'
        heading = summary[:summary.index('<span class="post-toggle">')]
        heading = re.sub(r'<span class="post-title">(.*?)</span>', r'<h1 class="post-title">\1</h1>', heading, flags=re.S)
        page_head = re.sub(r'<title>.*?</title>', '<title>' + escape(page_title) + '</title>', head, flags=re.S)
        page_head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + escape(description, quote=True) + '">', page_head)
        url = BASE_URL + id + '.html'
        page_head += '<link rel="canonical" href="' + url + '">'
        og = {"og:type": "article", "og:title": seo.get('title', title), "og:description": description,
              "og:url": url, "og:site_name": "40代のAI制作ノート", "og:locale": "ja_JP",
              "og:image": BASE_URL + "favicon-512x512.png",
              "og:image:alt": "40代のAI制作ノートのNロゴ",
              "article:published_time": article_seo.get(id, {}).get("published_time", "")}
        if not og['article:published_time']: del og['article:published_time']
        page_head += ''.join('<meta property="' + key + '" content="' + escape(value, quote=True) + '">' for key, value in og.items())
        page_head += '<meta name="twitter:card" content="summary">'
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
    home_og = {
        'og:type': 'website',
        'og:url': BASE_URL,
        'og:title': plain(re.search(r'<title>(.*?)</title>', source, re.S)[1]),
        'og:description': unescape(re.search(r'<meta name="description" content="([^"]*)">', source)[1]),
        'og:image': BASE_URL + 'favicon-512x512.png',
    }
    home_meta = ''.join('<meta property="' + key + '" content="' + escape(value, quote=True) + '">' for key, value in home_og.items())
    home = home.replace('</head>', home_meta + css + '<link rel="canonical" href="' + BASE_URL + '"></head>', 1)
    redirects = json.dumps({id:id+'.html' for id in ids})
    home += '<script>const articleURLs=' + redirects + ';function routeOldArticle(){const url=articleURLs[location.hash.slice(1)];if(url)location.replace(url+location.search);}window.addEventListener("hashchange",routeOldArticle);routeOldArticle();</script></body></html>\n'
    (root / 'index.html').write_text(links(home), encoding='utf-8')
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join('  <url><loc>' + escape(url) + '</loc></url>\n' for url in sitemap_urls)
    (root / 'sitemap.xml').write_text(xml + '</urlset>\n', encoding='utf-8')


def build_site(root, now=None):
    now = publication_time(now)
    site = root / '_site'
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    # Publish generated pages and existing root-level assets.
    allowed = {'.html', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.css', '.js', '.txt', '.xml'}
    hidden = {post['id'] + '.html' for post in scheduled_posts(root) if now < datetime.fromisoformat(post['publish_at'])}
    published = set(re.findall(r'<details class="post" id="([^"]+)">', (root / '_scheduled/blog-source.html').read_text(encoding='utf-8')))
    for source in root.iterdir():
        if source.name in hidden or (source.name.startswith('article-') and source.suffix == '.html' and source.stem not in published):
            continue
        if source.is_file() and not source.name.startswith(('.', '_')) and (source.suffix in allowed or source.name == 'CNAME'):
            shutil.copyfile(source, site / source.name)
    (site / '.nojekyll').touch()


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    now = datetime.now(timezone.utc)
    changed = publish(root, now)
    build_site(root, now)
    print('Published due articles.' if changed else 'No new articles due; current site prepared.')

