// GET /api/kanban → { columnas, tarjetas } estado completo del tablero.
import type { APIRoute } from 'astro';
import { asc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const [columnas, tarjetas] = await Promise.all([
    db.select().from(esquema.kanbanColumnas).orderBy(asc(esquema.kanbanColumnas.orden)),
    db.select().from(esquema.kanbanTarjetas).orderBy(asc(esquema.kanbanTarjetas.orden)),
  ]);
  return Response.json({ columnas, tarjetas });
};
