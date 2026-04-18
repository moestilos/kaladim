import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db, esquema } from '../../../../lib/db/cliente';
import { esquemaKanbanTarjeta } from '../../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../../lib/utilidades/autorizacion';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaKanbanTarjeta.parse(body);
    // Orden: último de la columna
    const res = await db.execute<{ max: number }>(sql`
      SELECT COALESCE(MAX(orden), -1)::int AS max FROM kanban_tarjetas WHERE columna_id = ${datos.columnaId}
    `);
    const max = Number((res.rows ?? res)?.[0]?.max ?? -1);
    const [creada] = await db.insert(esquema.kanbanTarjetas).values({ ...datos, orden: max + 1 } as any).returning();
    return Response.json(creada, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST tarjeta]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
