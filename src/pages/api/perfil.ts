// GET  /api/perfil → datos del usuario autenticado
// PATCH /api/perfil → actualizar propio perfil
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../lib/db/cliente';
import { obtenerAdmin } from '../../lib/utilidades/autorizacion';

export const prerender = false;

const esquemaPerfil = z.object({
  nombre: z.string().min(2).max(120).optional(),
  nombreUsuario: z.preprocess((v) => (v === '' ? null : v), z.string().min(2).max(60).nullable().optional()),
  telefono: z.preprocess((v) => (v === '' ? null : v), z.string().max(40).nullable().optional()),
  bio: z.preprocess((v) => (v === '' ? null : v), z.string().max(500).nullable().optional()),
  avatarUrl: z.preprocess((v) => (v === '' ? null : v), z.string().url().max(500).nullable().optional()),
});

export const GET: APIRoute = async ({ request }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;
  const [u] = await db.select().from(esquema.usuarios).where(eq(esquema.usuarios.email, auth.email));
  return Response.json(u ?? { email: auth.email, nombre: auth.nombre, rol: auth.rol });
};

export const PATCH: APIRoute = async ({ request }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json();
    const datos = esquemaPerfil.parse(body);
    const [act] = await db.update(esquema.usuarios)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.usuarios.email, auth.email))
      .returning();
    return Response.json(act);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[PATCH /api/perfil]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
