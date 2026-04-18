import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { esquemaIdea } from '../../../lib/utilidades/validaciones';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    // Caso especial: voto (increment)
    if (body.__votar) {
      const [act] = await db
        .update(esquema.ideas)
        .set({ votos: sql`${esquema.ideas.votos} + 1`, actualizadoEn: new Date() })
        .where(eq(esquema.ideas.id, params.id!))
        .returning();
      if (!act) return Response.json({ error: 'no_encontrado' }, { status: 404 });
      return Response.json(act);
    }
    const datos = esquemaIdea.partial().parse(body);
    const [actualizada] = await db
      .update(esquema.ideas)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.ideas.id, params.id!))
      .returning();
    if (!actualizada) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(actualizada);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[PATCH /api/ideas/:id]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  await db.delete(esquema.ideas).where(eq(esquema.ideas.id, params.id!));
  return Response.json({ ok: true });
};
