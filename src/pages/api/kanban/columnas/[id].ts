import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../../lib/db/cliente';
import { esquemaKanbanColumna } from '../../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../../lib/utilidades/autorizacion';

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaKanbanColumna.partial().parse(body);
    const [act] = await db.update(esquema.kanbanColumnas).set(datos as any).where(eq(esquema.kanbanColumnas.id, params.id!)).returning();
    if (!act) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(act);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  await db.delete(esquema.kanbanColumnas).where(eq(esquema.kanbanColumnas.id, params.id!));
  return Response.json({ ok: true });
};
