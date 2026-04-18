import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaProyecto } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const [fila] = await db.select().from(esquema.proyectos).where(eq(esquema.proyectos.id, params.id!));
  if (!fila) return Response.json({ error: 'no_encontrado' }, { status: 404 });
  return Response.json(fila);
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaProyecto.partial().parse(body);
    const [actualizado] = await db
      .update(esquema.proyectos)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.proyectos.id, params.id!))
      .returning();
    if (!actualizado) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(actualizado);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    }
    console.error('[PATCH /api/proyectos/:id]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  await db.delete(esquema.proyectos).where(eq(esquema.proyectos.id, params.id!));
  return Response.json({ ok: true });
};
