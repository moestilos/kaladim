// Configuración Auth.js — Google OAuth
// auth-astro lee este archivo automáticamente.

import Google from '@auth/core/providers/google';
import { defineConfig } from 'auth-astro';

const emailsAdmin = (import.meta.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default defineConfig({
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.rol = emailsAdmin.includes(user.email.toLowerCase()) ? 'admin' : 'cliente';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error – añadimos rol al user
        session.user.rol = token.rol ?? 'cliente';
      }
      return session;
    },
  },
  pages: {
    signIn: '/entrar',
  },
});
