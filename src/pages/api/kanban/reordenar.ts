// POST /api/kanban/reordenar — bulk update de orden (columnas o tarjetas).
// body: { tipo: 'columnas'|'tarjetas', items: [{ id, orden, columnaId? }] }
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquema_ = z.object({
  tipo: z.enum(['columnas', 'tarjetas']),
  items: z.array(z.object({
    id: z.string().uuid(),
    orden: z.number().int(),
    columnaId: z.string().uuid().optional(),
  })),
});

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const { tipo, items } = esquema_.parse(body);

    if (tipo === 'columnas') {
      await Promise.all(items.map((i) =>
        db.update(esquema.kanbanColumnas).set({ orden: i.orden }).where(eq(esquema.kanbanColumnas.id, i.id)),
      ));
    } else {
      await Promise.all(items.map((i) =>
        db.update(esquema.kanbanTarjetas)
          .set({ orden: i.orden, ...(i.columnaId ? { columnaId: i.columnaId } : {}), actualizadoEn: new Date() })
          .where(eq(esquema.kanbanTarjetas.id, i.id)),
      ));
    }

    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST reordenar]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
