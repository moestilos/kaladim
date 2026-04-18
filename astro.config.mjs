import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import auth from 'auth-astro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind({ applyBaseStyles: false }), auth()],
  server: { port: 4321, host: true },
  vite: {
    ssr: {
      noExternal: ['auth-astro'],
    },
  },
});
