// Helper: garantiza que el request venga de un admin autenticado.
// Lanza Response 401/403 si no.

import { getSession } from 'auth-astro/server';

export async function requerirAdmin(request: Request): Promise<Response | null> {
  // Bypass DEV
  const bypass = import.meta.env.DEV_ADMIN_BYPASS === 'true' || process.env.DEV_ADMIN_BYPASS === 'true';
  if (bypass && import.meta.env.DEV) return null;

  const sesion = await getSession(request);
  if (!sesion?.user) {
    return new Response(JSON.stringify({ error: 'no_autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // @ts-expect-error rol añadido en callbacks
  if (sesion.user.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'sin_permisos' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
