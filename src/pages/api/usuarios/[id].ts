// PATCH /api/usuarios/:id → cambiar rol / activar / desactivar
// DELETE /api/usuarios/:id → eliminar (admin estricto)
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdminEstricto } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquemaCambio = z.object({
  rol: z.enum(['admin', 'editor', 'viewer', 'cliente']).optional(),
  activo: z.boolean().optional(),
  nombre: z.string().min(2).max(120).optional(),
});

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaCambio.parse(body);
    const [act] = await db.update(esquema.usuarios)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.usuarios.id, params.id!))
      .returning();
    if (!act) return Response.json({ error: 'no_encontrado' }, { status: 404 });
    return Response.json(act);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  await db.delete(esquema.usuarios).where(eq(esquema.usuarios.id, params.id!));
  return Response.json({ ok: true });
};
