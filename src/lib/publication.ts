export const PUBLICATION_TIMEZONE = 'Asia/Kolkata';
export interface EditionLike {
  data: { slug: string; date: string; draft: boolean };
  body?: string;
}
export function publicationDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PUBLICATION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function validateEditions<T extends EditionLike>(entries: T[]): void {
  const slugs = new Set<string>();
  const dates = new Set<string>();
  for (const { data } of entries) {
    if (slugs.has(data.slug)) throw new Error(`Duplicate article slug: ${data.slug}`);
    slugs.add(data.slug);
    if (!data.draft) {
      if (dates.has(data.date)) throw new Error(`Duplicate publication date: ${data.date}`);
      dates.add(data.date);
    }
  }
}
export function publishedEditions<T extends EditionLike>(entries: T[], now = new Date()): T[] {
  validateEditions(entries);
  const today = publicationDate(now);
  return entries
    .filter((e) => !e.data.draft && e.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}
export function readingTime(body = ''): number {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>]/g, '');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
}
export function formatDate(date: string, compact = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: PUBLICATION_TIMEZONE,
    day: 'numeric',
    month: compact ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00+05:30`));
}
