import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db, esquema } from '../../../../lib/db/cliente';
import { esquemaKanbanColumna } from '../../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../../lib/utilidades/autorizacion';
import { sql } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaKanbanColumna.parse(body);
    // Auto-orden: último
    const [{ max }] = await db.execute<{ max: number }>(sql`SELECT COALESCE(MAX(orden), -1)::int AS max FROM kanban_columnas`).then((r: any) => r.rows ?? r);
    const [creada] = await db.insert(esquema.kanbanColumnas).values({ ...datos, orden: Number(max) + 1 }).returning();
    return Response.json(creada, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST columna]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
