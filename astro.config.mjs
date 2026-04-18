import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: false },
    maxDuration: 30,
  }),
  integrations: [tailwind({ applyBaseStyles: false }), auth()],
  server: { port: 4321, host: true },
  vite: {
    ssr: {
      noExternal: ['auth-astro'],
    },
  },
});
