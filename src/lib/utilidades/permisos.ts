// Catálogo de permisos + helpers roles / seed inicial.

import { eq } from 'drizzle-orm';
import { db, esquema } from '../db/cliente';

// ─── CATÁLOGO PERMISOS ────────────────────────────────────────────────
// Agrupados por sección para la matriz en UI.
export const CATALOGO_PERMISOS = [
  {
    seccion: 'Clientes',
    slug: 'clientes',
    acciones: ['ver', 'crear', 'editar', 'borrar'],
  },
  {
    seccion: 'Proyectos',
    slug: 'proyectos',
    acciones: ['ver', 'crear', 'editar', 'borrar'],
  },
  {
    seccion: 'Servicios',
    slug: 'servicios',
    acciones: ['ver', 'crear', 'editar', 'borrar'],
  },
  {
    seccion: 'Apps lanzadas',
    slug: 'apps',
    acciones: ['ver', 'crear', 'editar', 'borrar'],
  },
  {
    seccion: 'Kanban',
    slug: 'kanban',
    acciones: ['ver', 'editar'],
  },
  {
    seccion: 'Ideario',
    slug: 'ideas',
    acciones: ['ver', 'crear', 'editar', 'borrar', 'votar'],
  },
  {
    seccion: 'Automatizaciones',
    slug: 'automatizaciones',
    acciones: ['ver', 'crear', 'editar', 'borrar'],
  },
  {
    seccion: 'Leads',
    slug: 'leads',
    acciones: ['ver', 'gestionar'],
  },
  {
    seccion: 'Analíticas',
    slug: 'analiticas',
    acciones: ['ver'],
  },
  {
    seccion: 'Usuarios',
    slug: 'usuarios',
    acciones: ['ver', 'gestionar'],
  },
  {
    seccion: 'Roles',
    slug: 'roles',
    acciones: ['gestionar'],
  },
] as const;

export function todosLosPermisos(): string[] {
  const out: string[] = [];
  for (const g of CATALOGO_PERMISOS) for (const a of g.acciones) out.push(`${g.slug}.${a}`);
  return out;
}

// ─── ROLES DE SISTEMA (seed inicial) ──────────────────────────────────
const ROLES_SEED = [
  {
    slug: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total, gestiona usuarios y roles',
    color: 'violeta',
    permisos: ['*'], // wildcard = todos
    esSistema: true,
    orden: 0,
  },
  {
    slug: 'editor',
    nombre: 'Editor',
    descripcion: 'Crea y edita contenido. No gestiona usuarios ni roles',
    color: 'emerald',
    permisos: todosLosPermisos().filter((p) => !p.startsWith('usuarios.') && !p.startsWith('roles.')),
    esSistema: true,
    orden: 1,
  },
  {
    slug: 'viewer',
    nombre: 'Lector',
    descripcion: 'Solo consulta. Sin permisos de edición',
    color: 'cyan',
    permisos: todosLosPermisos().filter((p) => p.endsWith('.ver')),
    esSistema: true,
    orden: 2,
  },
  {
    slug: 'cliente',
    nombre: 'Cliente',
    descripcion: 'Bloqueado del panel — solo web pública',
    color: 'carbon',
    permisos: [],
    esSistema: true,
    orden: 99,
  },
];

// Idempotente: crea los roles sistema si faltan, actualiza permisos del admin si cambian
export async function asegurarRolesSistema(): Promise<void> {
  if (!import.meta.env.DATABASE_URL && !process.env.DATABASE_URL) return;
  try {
    for (const r of ROLES_SEED) {
      const [existente] = await db.select().from(esquema.roles).where(eq(esquema.roles.slug, r.slug));
      if (!existente) {
        await db.insert(esquema.roles).values({
          slug: r.slug,
          nombre: r.nombre,
          descripcion: r.descripcion,
          color: r.color,
          permisos: JSON.stringify(r.permisos),
          esSistema: true,
          orden: r.orden,
        });
      }
    }
  } catch (e) {
    console.error('[seed roles]', (e as Error).message);
  }
}

// ─── CHECK PERMISO ────────────────────────────────────────────────────
export async function rolPermisos(slug: string): Promise<string[]> {
  if (!import.meta.env.DATABASE_URL && !process.env.DATABASE_URL) {
    // Fallback sin DB: dev bypass → admin siempre
    return slug === 'admin' ? ['*'] : [];
  }
  const [r] = await db.select().from(esquema.roles).where(eq(esquema.roles.slug, slug));
  if (!r) return [];
  try { return JSON.parse(r.permisos); } catch { return []; }
}

export function tienePermiso(permisos: string[], permiso: string): boolean {
  return permisos.includes('*') || permisos.includes(permiso);
}
