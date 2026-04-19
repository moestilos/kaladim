// GET  /api/roles  → lista roles (cualquier admin puede leer para selectors)
// POST /api/roles  → crear rol (solo superadmin con permiso roles.gestionar)
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { asc } from 'drizzle-orm';
import { db, esquema } from '../../../lib/db/cliente';
import { obtenerAdmin, requerirAdminEstricto } from '../../../lib/utilidades/autorizacion';
import { asegurarRolesSistema } from '../../../lib/utilidades/permisos';

export const prerender = false;

const esquemaRol = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, _ y -'),
  nombre: z.string().min(2).max(80),
  descripcion: z.preprocess((v) => (v === '' ? null : v), z.string().max(255).nullable().optional()),
  color: z.enum(['carbon', 'violeta', 'emerald', 'amber', 'red', 'cyan', 'rosa', 'azul', 'naranja']).default('carbon'),
  permisos: z.union([z.array(z.string()), z.string()]).transform((v) =>
    typeof v === 'string' ? v : JSON.stringify(v),
  ).default('[]'),
  orden: z.coerce.number().int().default(10),
  temporal: z.coerce.boolean().default(false),
  duracionDiasPorDefecto: z.coerce.number().int().positive().default(7),
});

export const GET: APIRoute = async ({ request }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;
  await asegurarRolesSistema();
  const filas = await db.select().from(esquema.roles).orderBy(asc(esquema.roles.orden), asc(esquema.roles.nombre));
  return Response.json(filas);
};

export const POST: APIRoute = async ({ request }) => {
  const err = await requerirAdminEstricto(request);
  if (err) return err;
  try {
    const body = await request.json();
    const datos = esquemaRol.parse(body);
    const [creado] = await db.insert(esquema.roles).values({ ...datos, esSistema: false } as any).returning();
    return Response.json(creado, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: 'validacion', detalles: e.errors }, { status: 400 });
    console.error('[POST /api/roles]', e);
    return Response.json({ error: 'servidor' }, { status: 500 });
  }
};
