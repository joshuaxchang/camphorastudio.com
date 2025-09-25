// src/content/config.ts
// This file defines the structure for the product content.

import { defineCollection, z } from 'astro:content';

// Import `image` from the schema helper
const productsCollection = defineCollection({
	schema: ({ image }) => z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date().optional(),
		thumbnail: image().optional(),
		images: z.array(image()),
	}),
});

export const collections = {
	'products': productsCollection,
};

