// POST /api/ideas/:id/votar — toggle voto del admin actual.
// Respuesta: { votos, miVoto, admins }
import type { APIRoute } from 'astro';
import { and, eq, sql } from 'drizzle-orm';
import { db, esquema } from '../../../../lib/db/cliente';
import { obtenerAdmin } from '../../../../lib/utilidades/autorizacion';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;

  const ideaId = params.id!;
  const email = auth.email;

  try {
    const [existente] = await db.select()
      .from(esquema.ideaVotos)
      .where(and(eq(esquema.ideaVotos.ideaId, ideaId), eq(esquema.ideaVotos.usuarioEmail, email)));

    if (existente) {
      await db.delete(esquema.ideaVotos).where(eq(esquema.ideaVotos.id, existente.id));
    } else {
      await db.insert(esquema.ideaVotos).values({ ideaId, usuarioEmail: email });
    }

    // Contadores actualizados
    const totalVotosRes = await db.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n FROM idea_votos WHERE idea_id = ${ideaId}
    `);
    const miVotoRes = await db.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n FROM idea_votos WHERE idea_id = ${ideaId} AND usuario_email = ${email}
    `);
    const adminsRes = await db.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n FROM usuarios
      WHERE rol IN ('admin','editor') AND activo = true
    `);

    const totalVotos = Number((totalVotosRes.rows ?? totalVotosRes)?.[0]?.n ?? 0);
    const miVoto = Number((miVotoRes.rows ?? miVotoRes)?.[0]?.n ?? 0) > 0;
    const admins = Number((adminsRes.rows ?? adminsRes)?.[0]?.n ?? 1);

    // Sincronizar contador en la idea
    await db.update(esquema.ideas).set({ votos: totalVotos }).where(eq(esquema.ideas.id, ideaId));

    return Response.json({ votos: totalVotos, miVoto, admins });
  } catch (e) {
    console.error('[POST votar]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
