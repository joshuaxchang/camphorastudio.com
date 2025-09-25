// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://joshuaxchang.com",
  integrations: [tailwind(), mdx(), sitemap()],

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),

  redirects: {
    '/walker': '/projects/walker',
  },

});