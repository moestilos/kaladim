// Configuración Auth.js — Google OAuth
// auth-astro lee este archivo automáticamente.
// Upsert usuario en DB al login. Rol viene de DB (fallback: ADMIN_EMAILS env).

import Google from '@auth/core/providers/google';
import { defineConfig } from 'auth-astro';
import { db, esquema } from './src/lib/db/cliente';
import { eq, sql } from 'drizzle-orm';

const emailsAdminSemilla = (import.meta.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function upsertUsuario(email: string, nombre: string, avatar: string | null): Promise<string> {
  if (!import.meta.env.DATABASE_URL && !process.env.DATABASE_URL) {
    // Sin DB → rol según semilla env
    return emailsAdminSemilla.includes(email.toLowerCase()) ? 'admin' : 'viewer';
  }
  try {
    const [existente] = await db.select().from(esquema.usuarios).where(eq(esquema.usuarios.email, email));
    if (existente) {
      await db.update(esquema.usuarios)
        .set({ nombre, avatarUrl: avatar, ultimoAcceso: new Date(), actualizadoEn: new Date() })
        .where(eq(esquema.usuarios.email, email));
      return existente.rol;
    }
    // Nuevo: si está en semilla env → admin; si no → viewer (sin acceso hasta que admin le cambie rol)
    const rol = emailsAdminSemilla.includes(email.toLowerCase()) ? 'admin' : 'viewer';
    // Primer usuario de la DB → siempre admin (para no bloquear el bootstrap)
    const [{ count }] = await db.execute<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM usuarios`).then((r: any) => r.rows ?? r) as any;
    const rolFinal = Number(count) === 0 ? 'admin' : rol;
    await db.insert(esquema.usuarios).values({
      email, nombre, avatarUrl: avatar, rol: rolFinal as any, ultimoAcceso: new Date(),
    });
    return rolFinal;
  } catch (e) {
    console.error('[auth upsert]', e);
    return emailsAdminSemilla.includes(email.toLowerCase()) ? 'admin' : 'viewer';
  }
}

export default defineConfig({
  trustHost: true,
  basePath: '/api/auth',
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.rol = await upsertUsuario(user.email, user.name ?? user.email, user.image ?? null);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error – añadimos rol al user
        session.user.rol = token.rol ?? 'viewer';
      }
      return session;
    },
  },
  pages: {
    signIn: '/entrar',
  },
});
