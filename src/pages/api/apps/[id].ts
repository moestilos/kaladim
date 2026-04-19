import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaApp } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaApp.partial().parse(body);
    const [actualizado] = await db
      .update(esquema.apps)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.apps.id, params.id!))
      .returning();
    if (!actualizado) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(actualizado);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[PATCH /api/apps/:id]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  await db.delete(esquema.apps).where(eq(esquema.apps.id, params.id!));
  return Response.json({ ok: true });
};
