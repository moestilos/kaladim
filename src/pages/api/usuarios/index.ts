// GET  /api/usuarios → lista usuarios (admin)
// POST /api/usuarios → invitar usuario (crea row con rol viewer — accederá al hacer login Google)
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdminEstricto, obtenerAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquemaInvitar = z.object({
  email: z.string().email().max(255),
  nombre: z.string().min(2).max(120),
  rol: z.string().min(2).max(40).default('viewer'),
});

export const GET: APIRoute = async ({ request }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;
  const filas = await db.select().from(esquema.usuarios).orderBy(desc(esquema.usuarios.creadoEn));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaInvitar.parse(body);
    // Si ya existe, solo actualiza nombre/rol
    const [existente] = await db.select().from(esquema.usuarios).where(eq(esquema.usuarios.email, datos.email));
    if (existente) {
      const [act] = await db.update(esquema.usuarios)
        .set({ nombre: datos.nombre, rol: datos.rol as any, activo: true, actualizadoEn: new Date() })
        .where(eq(esquema.usuarios.email, datos.email))
        .returning();
      return Response.json(act);
    }
    const [creado] = await db.insert(esquema.usuarios).values({
      email: datos.email, nombre: datos.nombre, rol: datos.rol as any,
    }).returning();
    return Response.json(creado, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST /api/usuarios]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
