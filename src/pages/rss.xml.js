import { getCollection } from 'astro:content';

const SITE = 'https://undergroundmusic.party';

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const escapeCdata = (value = '') =>
  String(value).replace(/]]>/g, ']]]]><![CDATA[>');

const normalizeHashtags = (hashtags = []) =>
  hashtags
    .map((hashtag) => String(hashtag).trim().replace(/^#+/, '').trim())
    .filter(Boolean)
    .map((hashtag) => `#${hashtag}`)
    .join(' ');

const decodeBasicHtmlEntities = (value = '') =>
  String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

const markdownToReviewText = (markdown = '') => {
  let text = String(markdown).replace(/\r\n?/g, '\n');

  // Remove comments and fenced code blocks.
  text = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*(```|~~~)[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '');

  // Remove complete HTML blocks that contain players or embeds.
  text = text
    .replace(
      /<(div|section|figure)\b[^>]*>[\s\S]*?<iframe\b[\s\S]*?<\/iframe\s*>[\s\S]*?<\/\1\s*>/gi,
      ''
    )
    .replace(
      /<(div|section|figure)\b[^>]*\bclass\s*=\s*(["'])[^"']*(?:embed|player)[^"']*\2[^>]*>[\s\S]*?<\/\1\s*>/gi,
      ''
    )
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<iframe\b[^>]*\/\s*>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed\b[^>]*\/?\s*>/gi, '')
    .replace(/<(audio|video)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');

  // Remove images completely, including Markdown alt text.
  text = text
    .replace(/!\[[^\]]*\]\([^\n)]*(?:\([^\n)]*\)[^\n)]*)*\)/g, '')
    .replace(/!\[[^\]]*\]\s*\[[^\]]*\]/g, '')
    .replace(/<img\b[^>]*\/?>/gi, '');

  // Keep visible Markdown-link text while dropping destinations.
  text = text
    .replace(/\[([^\]]+)\]\((?:\\.|[^)])*\)/g, '$1')
    .replace(/\[([^\]]+)\]\s*\[[^\]]*\]/g, '$1')
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, '')
    .replace(/<((?:https?:\/\/|www\.)[^>]+)>/gi, '');

  // Remove plain URLs, then strip remaining HTML and Markdown syntax.
  text = text
    .replace(/(?:https?:\/\/|www\.)[^\s<>()\[\]{}]+/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<\/h[1-6]\s*>/gi, '\n\n')
    .replace(/<\/li\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  text = decodeBasicHtmlEntities(text)
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}(?:[-+*]|\d+[.)])\s+/gm, '')
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/(`+)(.*?)\1/g, '$2')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1');

  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export async function GET() {
  const posts = await getCollection('editorial', ({ data }) => !data.draft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const items = sortedPosts
    .map((post) => {
      const url = `${SITE}/editorial/${post.id}`;
      const genres = (post.data.genres ?? []).join(', ');
      const hashtags = normalizeHashtags(post.data.hashtags);
      const reviewText = markdownToReviewText(post.body ?? '');

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>${post.data.image ? `
      <enclosure url="${escapeXml(post.data.image)}" type="image/jpeg" />` : ''}
      <ums:genres>${escapeXml(genres)}</ums:genres>
      <ums:hashtags>${escapeXml(hashtags)}</ums:hashtags>
      <ums:youtubeUrl>${escapeXml(post.data.links.youtube)}</ums:youtubeUrl>
      
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss
  version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:ums="https://undergroundmusic.party/rss"
>
  <channel>
    <title>Underground Music Squad Editorial</title>
    <link>${SITE}/editorial</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Independent music reviews, interviews, weekly picks and underground discoveries from Underground Music Squad.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
