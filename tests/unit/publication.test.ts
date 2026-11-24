import { describe, expect, it } from 'vitest';
import {
  publicationDate,
  publishedEditions,
  readingTime,
  validateEditions,
} from '../../src/lib/publication';
const edition = (slug: string, date: string, draft = false) => ({ data: { slug, date, draft } });
describe('daily publishing', () => {
  it('switches the publication date at midnight IST, not UTC', () => {
    expect(publicationDate(new Date('2026-10-18T18:29:59Z'))).toBe('2026-10-18');
    expect(publicationDate(new Date('2026-10-18T18:30:00Z'))).toBe('2026-10-19');
  });
  it('excludes drafts and future articles and sorts the visible editions newest first', () => {
    const entries = [
      edition('old', '2026-10-17'),
      edition('future', '2026-10-20'),
      edition('draft', '2026-10-18', true),
      edition('current', '2026-10-19'),
    ];
    expect(
      publishedEditions(entries, new Date('2026-10-19T07:00:00+05:30')).map((e) => e.data.slug),
    ).toEqual(['current', 'old']);
  });
  it('retains the latest edition when a day is missing', () => {
    expect(
      publishedEditions([edition('last', '2026-10-17')], new Date('2026-10-19T10:00:00Z'))[0].data
        .date,
    ).toBe('2026-10-17');
  });
  it('rejects duplicate dates, including dates scheduled for the future', () => {
    expect(() =>
      validateEditions([edition('one', '2030-01-01'), edition('two', '2030-01-01')]),
    ).toThrow('Duplicate publication date');
  });
  it('allows drafts on the same date but rejects duplicate slugs', () => {
    expect(() =>
      validateEditions([edition('one', '2026-10-19'), edition('two', '2026-10-19', true)]),
    ).not.toThrow();
    expect(() =>
      validateEditions([edition('same', '2026-10-18'), edition('same', '2026-10-19')]),
    ).toThrow('Duplicate article slug');
  });
  it('can return an empty edition list without mutating the source', () => {
    const entries = [edition('future', '2030-01-01')];
    expect(publishedEditions(entries, new Date('2026-10-19T00:00:00Z'))).toEqual([]);
    expect(entries).toHaveLength(1);
  });
  it('calculates reading time from visible words, excluding image and link destinations', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('word '.repeat(401))).toBe(3);
    expect(
      readingTime(
        '![A long image description](https://example.com/a.jpg) [Read this](https://example.com/)',
      ),
    ).toBe(1);
  });
});
