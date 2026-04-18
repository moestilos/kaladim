import type { APIRoute } from 'astro';
import { requerirAdmin } from '../../../lib/utilidades/autorizacion';
import { obtenerResumenVisitas } from '../../../lib/utilidades/analiticas';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const err = await requerirAdmin(request);
  if (err) return err;

  const dias = Math.min(365, Math.max(7, Number(url.searchParams.get('dias') ?? '30')));

  try {
    const resumen = await obtenerResumenVisitas(dias);
    return Response.json(resumen);
  } catch (e) {
    console.error('[GET /api/estadisticas/visitas]', e);
    return Response.json({ error: 'servidor', mensaje: (e as Error).message }, { status: 500 });
  }
};
