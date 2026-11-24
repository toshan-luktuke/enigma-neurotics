import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Use a real calendar date in YYYY-MM-DD format.');
const discoveries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/discoveries' }),
  schema: ({ image }) =>
    z
      .object({
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        title: z.string().min(1),
        summary: z.string().min(1),
        date: dateOnly,
        category: z.enum(['Nature', 'Science', 'Space', 'Technology', 'History', 'Culture']),
        draft: z.boolean().default(false),
        sources: z
          .array(
            z.object({
              title: z.string().min(1),
              publisher: z.string().min(1),
              url: z.url().refine((v) => v.startsWith('https://'), 'Use HTTPS sources.'),
            }),
          )
          .min(1),
        image: image().optional(),
        imageAlt: z.string().optional(),
        imageCredit: z.string().optional(),
        imageCreditUrl: z.url().optional(),
      })
      .refine(
        (data) => !data.image || Boolean(data.imageAlt?.trim()),
        'An image needs alternative text.',
      ),
});
export const collections = { discoveries };
