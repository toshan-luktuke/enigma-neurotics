import type { APIRoute } from 'astro';
import { getPublishedEditions } from '../lib/content';
import { xml } from '../lib/xml';
export const GET: APIRoute = async ({ site }) => {
  const entries = await getPublishedEditions();
  const paths = [
    '/',
    '/archive/',
    '/about/',
    ...entries.map((entry) => `/discoveries/${entry.data.slug}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${xml(new URL(path, site).href)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
