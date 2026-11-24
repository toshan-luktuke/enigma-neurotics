import type { APIRoute } from 'astro';
import { getPublishedEditions } from '../lib/content';
import { xml } from '../lib/xml';
export const GET: APIRoute = async ({ site }) => {
  const entries = await getPublishedEditions();
  const origin = site!.href;
  const items = entries
    .map(({ data }) => {
      const url = new URL(`/discoveries/${data.slug}/`, origin).href;
      return `<item><title>${xml(data.title)}</title><description>${xml(data.summary)}</description><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><pubDate>${new Date(`${data.date}T06:15:00+05:30`).toUTCString()}</pubDate><category>${xml(data.category)}</category></item>`;
    })
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="utf-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>TIL: daily discoveries</title><description>One interesting discovery each day.</description><link>${xml(origin)}</link><language>en</language><atom:link href="${xml(new URL('/rss.xml', origin).href)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
  );
};
