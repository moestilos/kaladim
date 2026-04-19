import type { APIRoute } from 'astro';
import { z } from 'zod';
import { asc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaApp } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const filas = await db.select().from(esquema.apps).orderBy(asc(esquema.apps.orden));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaApp.parse(body);
    const [creado] = await db.insert(esquema.apps).values(datos as any).returning();
    return Response.json(creado, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST /api/apps]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
