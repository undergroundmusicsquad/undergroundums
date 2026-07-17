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
      'featured-album',
    ]),

    topLabel: z.string().optional(),
    bottomLabel: z.string().optional(),

    genres: z.array(z.string()),

    hashtags: z
      .array(z.string())
      .min(1)
      .refine(
        (values) =>
          values.some(
            (value) => value.trim().replace(/^#+/, '').trim().length > 0
          ),
        {
          message: 'hashtags must contain at least one non-empty hashtag',
        }
      ),

    image: z.string().optional(),

    music: z
      .object({
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
      })
      .optional(),

    links: z.object({
      soundcloud: z.string().trim().optional(),
      bandcamp: z.string().trim().optional(),
      spotify: z.string().trim().optional(),
      youtube: z.string().trim().min(1),
      instagram: z.string().trim().optional(),
      linktree: z.string().trim().optional(),
      website: z.string().trim().optional(),
    }),

    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  editorial,
};
