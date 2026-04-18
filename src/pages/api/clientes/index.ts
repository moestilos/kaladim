// GET  /api/clientes  → lista clientes
// POST /api/clientes  → crea cliente
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaCliente } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  const filas = await db.select().from(esquema.clientes).orderBy(desc(esquema.clientes.creadoEn));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaCliente.parse(body);
    const [creado] = await db.insert(esquema.clientes).values(datos as any).returning();
    return Response.json(creado, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    }
    console.error('[POST /api/clientes]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
