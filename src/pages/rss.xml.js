import { getCollection } from 'astro:content';

const SITE = 'https://undergroundmusic.party';

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET() {
  const posts = await getCollection('editorial', ({ data }) => !data.draft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const items = sortedPosts
    .map((post) => {
      const url = `${SITE}/editorial/${post.id}`;
      const genres = (post.data.genres ?? []).join(', ');
      const description = genres
        ? `${post.data.description} Genres: ${genres}.`
        : post.data.description;

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>${post.data.image ? `
      <enclosure url="${escapeXml(post.data.image)}" type="image/jpeg" />` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
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
