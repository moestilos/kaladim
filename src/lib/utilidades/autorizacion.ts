// Helpers autorización — admin + email actual.

import { getSession } from 'auth-astro/server';

type ResultadoAuth = { email: string; rol: string; nombre?: string | null };

export async function obtenerAdmin(request: Request): Promise<ResultadoAuth | Response> {
  const bypass = import.meta.env.DEV_ADMIN_BYPASS === 'true' || process.env.DEV_ADMIN_BYPASS === 'true';
  if (bypass && import.meta.env.DEV) {
    return { email: 'dev@kaladim.local', rol: 'admin', nombre: 'Admin Dev' };
  }

  const sesion = await getSession(request);
  if (!sesion?.user?.email) {
    return new Response(JSON.stringify({ error: 'no_autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // @ts-expect-error rol añadido en callbacks
  const rol = sesion.user.rol ?? 'viewer';
  if (rol === 'cliente') {
    return new Response(JSON.stringify({ error: 'sin_permisos' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { email: sesion.user.email, rol, nombre: sesion.user.name };
}

// Back-compat
export async function requerirAdmin(request: Request): Promise<Response | null> {
  const r = await obtenerAdmin(request);
  return r instanceof Response ? r : null;
}

// Solo rol admin (no editor/viewer) — para acciones sensibles
export async function requerirAdminEstricto(request: Request): Promise<Response | null> {
  const r = await obtenerAdmin(request);
  if (r instanceof Response) return r;
  if (r.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'solo_admin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
