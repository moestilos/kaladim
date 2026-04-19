// PATCH/DELETE /api/roles/:id — gestión rol (no se borran roles sistema)
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { requerirAdminEstricto } from '../../../lib/utilidades/autorizacion';

export const prerender = false;

const esquemaActualizar = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, _ y -').optional(),
  nombre: z.string().min(2).max(80).optional(),
  descripcion: z.preprocess((v) => (v === '' ? null : v), z.string().max(255).nullable().optional()),
  color: z.enum(['carbon', 'violeta', 'emerald', 'amber', 'red', 'cyan', 'rosa', 'azul', 'naranja']).optional(),
  permisos: z.union([z.array(z.string()), z.string()]).transform((v) =>
    typeof v === 'string' ? v : JSON.stringify(v),
  ).optional(),
  orden: z.coerce.number().int().optional(),
  temporal: z.coerce.boolean().optional(),
  duracionDiasPorDefecto: z.coerce.number().int().positive().optional(),
});

export const PATCH: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaActualizar.parse(body);
    const [existente] = await db.select().from(esquema.roles).where(eq(esquema.roles.id, params.id!));
    if (!existente) return Response.json({ error: 'no_encontrado' }, { status: 404 });

    // Si cambia slug → validar que no exista + reasignar usuarios en cascada
    if (datos.slug && datos.slug !== existente.slug) {
      const [duplicado] = await db.select().from(esquema.roles).where(eq(esquema.roles.slug, datos.slug));
      if (duplicado && duplicado.id !== existente.id) {
        return Response.json({ error: 'slug_duplicado' }, { status: 400 });
      }
      // Cascade: usuarios.rol + usuario_roles.rol_slug
      await db.update(esquema.usuarios)
        .set({ rol: datos.slug })
        .where(eq(esquema.usuarios.rol, existente.slug));
      await db.update(esquema.usuarioRoles)
        .set({ rolSlug: datos.slug })
        .where(eq(esquema.usuarioRoles.rolSlug, existente.slug));
    }

    const [act] = await db.update(esquema.roles)
      .set({ ...datos, actualizadoEn: new Date() } as any)
      .where(eq(esquema.roles.id, params.id!))
      .returning();
    return Response.json(act);
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[PATCH role]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  const [r] = await db.select().from(esquema.roles).where(eq(esquema.roles.id, params.id!));
  if (!r) return Response.json({ error: 'no_encontrado' }, { status: 404 });
  if (r.esSistema) return Response.json({ error: 'rol_sistema_protegido' }, { status: 403 });
  // Usuarios con este rol → degradar a viewer
  await db.update(esquema.usuarios).set({ rol: 'viewer' } as any).where(eq(esquema.usuarios.rol, r.slug));
  await db.delete(esquema.roles).where(eq(esquema.roles.id, params.id!));
  return Response.json({ ok: true });
};
