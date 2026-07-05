import { getCollection } from 'astro:content';

const SITE = 'https://undergroundmusic.party';
const PAGE_SIZE = 7;

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const urlEntry = (loc, lastmod) => `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;

export async function GET() {
  const posts = await getCollection('editorial', ({ data }) => !data.draft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const urls = [];
  urls.push(urlEntry(`${SITE}/`));
  urls.push(urlEntry(`${SITE}/editorial`));
  urls.push(urlEntry(`${SITE}/rss.xml`));

  const editorialPages = Math.ceil(sortedPosts.length / PAGE_SIZE);
  for (let page = 2; page <= editorialPages; page += 1) {
    urls.push(urlEntry(`${SITE}/editorial/page/${page}`));
  }

  sortedPosts.forEach((post) => {
    urls.push(urlEntry(`${SITE}/editorial/${post.id}`, post.data.date.toISOString()));
  });

  const genres = [
    ...new Set(
      sortedPosts.flatMap((post) => post.data.genres ?? [])
    ),
  ];

  genres.forEach((genre) => {
    const genreSlug = slugify(genre);
    const genrePosts = sortedPosts.filter((post) =>
      (post.data.genres ?? []).some((postGenre) => slugify(postGenre) === genreSlug)
    );

    const genrePages = Math.ceil(genrePosts.length / PAGE_SIZE);
    urls.push(urlEntry(`${SITE}/editorial/genre/${genreSlug}`));

    for (let page = 2; page <= genrePages; page += 1) {
      urls.push(urlEntry(`${SITE}/editorial/genre/${genreSlug}/${page}`));
    }
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    }
  );
}
