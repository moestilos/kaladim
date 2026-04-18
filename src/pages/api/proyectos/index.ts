import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const filas = await db.select().from(esquema.proyectos).orderBy(desc(esquema.proyectos.creadoEn));
  return Response.json(filas);
};
