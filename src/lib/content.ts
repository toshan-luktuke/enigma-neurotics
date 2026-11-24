import { getCollection } from 'astro:content';
import { publishedEditions } from './publication';
// All public surfaces must use this selector, including feeds and search.
export async function getPublishedEditions() {
  return publishedEditions(await getCollection('discoveries'));
}
