import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaServicio } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const [fila] = await db.select().from(esquema.serviciosContratados).where(eq(esquema.serviciosContratados.id, params.id!));
  if (!fila) return Response.json({ error: 'no_encontrado' }, { status: 404 });
  return Response.json(fila);
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaServicio.partial().parse(body);
    const [actualizado] = await db
      .update(esquema.serviciosContratados)
      .set(datos as any)
      .where(eq(esquema.serviciosContratados.id, params.id!))
      .returning();
    if (!actualizado) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(actualizado);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    }
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  await db.delete(esquema.serviciosContratados).where(eq(esquema.serviciosContratados.id, params.id!));
  return Response.json({ ok: true });
};
