// POST /api/ideas/:id/convertir — crea un proyecto desde la idea y la vincula.
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../../lib/db/cliente';
import { requerirAdmin } from '../../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquema_ = z.object({
  clienteId: z.string().uuid(),
});

export const POST: APIRoute = async ({ request, params }) => {
  const err = await requerirAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const { clienteId } = esquema_.parse(body);
    const [idea] = await db.select().from(esquema.ideas).where(eq(esquema.ideas.id, params.id!));
    if (!idea) return Response.json({ error: 'no_encontrada' }, { status: 404 });

    const [proyecto] = await db.insert(esquema.proyectos).values({
      clienteId,
      titulo: idea.titulo,
      descripcion: idea.descripcion,
      estado: 'borrador',
    } as any).returning();

    await db.update(esquema.ideas)
      .set({ proyectoId: proyecto.id, estado: 'planificada', actualizadoEn: new Date() })
      .where(eq(esquema.ideas.id, params.id!));

    return Response.json({ proyectoId: proyecto.id });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST convertir]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
