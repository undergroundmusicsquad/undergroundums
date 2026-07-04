import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const editorial = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/editorial',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum([
      'track-of-the-day',
      'track-of-the-week',
      'track-of-the-month',
      'interview',
      'review',
    ]),
    genres: z.array(z.string()),
    image: z.string().optional(),

    music: z.object({
  platform: z.enum([
    'bandcamp',
    'spotify',
    'soundcloud',
    'youtube',
    'apple',
    'other',
  ]),
  url: z.string().url(),
  embed: z.string().optional(),
  placement: z.enum(['hero', 'body']).default('body'),
}).optional(),

    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  editorial,
};