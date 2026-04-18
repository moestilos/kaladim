import type { APIRoute } from 'astro';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaIdea } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const filas = await db.select().from(esquema.ideas).orderBy(desc(esquema.ideas.creadoEn));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaIdea.parse(body);
    const [creada] = await db.insert(esquema.ideas).values(datos as any).returning();
    return Response.json(creada, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST /api/ideas]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
