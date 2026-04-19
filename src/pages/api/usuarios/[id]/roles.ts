// POST   /api/usuarios/:id/roles              → asignar rol (body: { rolSlug, duracionDias? })
// DELETE /api/usuarios/:id/roles?slug=xxx     → quitar rol
// GET    /api/usuarios/:id/roles              → roles activos (no expirados) del usuario

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { db, esquema } from '../../../../lib/db/cliente';
import { requerirAdminEstricto } from '../../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquemaAsignar = z.object({
  rolSlug: z.string().min(2).max(40),
  duracionDias: z.coerce.number().int().positive().optional(),
});

export const GET: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  const filas = await db.select().from(esquema.usuarioRoles)
    .where(and(
      eq(esquema.usuarioRoles.usuarioId, params.id!),
      or(isNull(esquema.usuarioRoles.expiraEn), gt(esquema.usuarioRoles.expiraEn, new Date())),
    ));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  try {
    const body = await request.json();
    const { rolSlug, duracionDias } = esquemaAsignar.parse(body);

    // Buscar el rol en catálogo
    const [rol] = await db.select().from(esquema.roles).where(eq(esquema.roles.slug, rolSlug));
    if (!rol) return Response.json({ error: 'rol_no_existe' }, { status: 404 });

    // Si rol es temporal → usar duracionDias (body) o default del rol
    let expiraEn: Date | null = null;
    if (rol.temporal) {
      const dias = duracionDias ?? rol.duracionDiasPorDefecto ?? 7;
      expiraEn = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
    }

    // Evitar duplicados — si ya tiene el rol activo, refrescar expiración
    const [yaExiste] = await db.select().from(esquema.usuarioRoles)
      .where(and(
        eq(esquema.usuarioRoles.usuarioId, params.id!),
        eq(esquema.usuarioRoles.rolSlug, rolSlug),
      ));

    if (yaExiste) {
      const [act] = await db.update(esquema.usuarioRoles)
        .set({ expiraEn })
        .where(eq(esquema.usuarioRoles.id, yaExiste.id))
        .returning();
      return Response.json(act);
    }

    const [creado] = await db.insert(esquema.usuarioRoles).values({
      usuarioId: params.id!,
      rolSlug,
      expiraEn,
    }).returning();
    return Response.json(creado, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST roles]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params, url }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug_requerido' }, { status: 400 });

  await db.delete(esquema.usuarioRoles)
    .where(and(
      eq(esquema.usuarioRoles.usuarioId, params.id!),
      eq(esquema.usuarioRoles.rolSlug, slug),
    ));

  return Response.json({ ok: true });
};
