// Utilidades analytics — registro visitas respetando privacidad.
// IP + UA se hashean (SHA-256) pa' evitar guardar PII directa.

import { createHash } from 'node:crypto';
import { db, esquema } from '../db/cliente';

export function hashearIp(ip: string, userAgent: string): string {
  // Salt por día para que el mismo usuario genere hashes distintos cada día
  // (protege identificabilidad a largo plazo pero permite conteo único diario).
  const dia = new Date().toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${ip}|${userAgent}|${dia}|kaladim-salt-v1`)
    .digest('hex')
    .slice(0, 32);
}

export function obtenerIp(request: Request, headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  );
}

// Patrones de bot básicos — evita inflar métricas con crawlers.
const REGEX_BOT = /bot|crawl|spider|lighthouse|headless|puppeteer|playwright|curl|wget|axios|slurp|facebookexternalhit|whatsapp|telegram|preview/i;

export function esBot(userAgent: string): boolean {
  return !userAgent || REGEX_BOT.test(userAgent);
}

// Ventana de deduplicación: misma IP + misma ruta dentro de este tiempo
// cuenta como UNA sola visita. Evita inflar métricas con refrescos.
const VENTANA_DEDUPE_MINUTOS = 30;

// Registro fire-and-forget con deduplicación. No bloquea la respuesta.
export function registrarVisitaAsync(params: {
  ruta: string;
  ipHash: string;
  referrer: string | null;
  userAgent: string;
  pais: string | null;
}): void {
  if (!import.meta.env.DATABASE_URL && !process.env.DATABASE_URL) return;

  (async () => {
    try {
      const { sql } = await import('drizzle-orm');
      // ¿Ya registramos esta IP+ruta en la ventana? → skip
      const res = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n FROM visitas
        WHERE ip_hash = ${params.ipHash}
          AND ruta = ${params.ruta}
          AND creado_en > NOW() - (${VENTANA_DEDUPE_MINUTOS} || ' minutes')::interval
        LIMIT 1
      `);
      const yaExiste = Number((res.rows ?? res)?.[0]?.n ?? 0) > 0;
      if (yaExiste) return; // refresh o navegación repetida → no contamos

      await db.insert(esquema.visitas).values({
        ruta: params.ruta.slice(0, 500),
        ipHash: params.ipHash,
        referrer: params.referrer?.slice(0, 500) ?? null,
        userAgent: params.userAgent.slice(0, 500),
        pais: params.pais,
      });
    } catch (e) {
      console.error('[analytics] error registrando visita:', (e as Error).message);
    }
  })();
}

// ─── Agregados para el dashboard ─────────────────────────────────────

export type ResumenVisitas = {
  serie: { dia: string; visitas: number; unicos: number }[]; // últimos N días
  total: number;
  unicos: number;
  topRutas: { ruta: string; visitas: number }[];
  topReferrers: { referrer: string; visitas: number }[];
  vsAnterior: number; // % cambio vs periodo anterior
};

export async function obtenerResumenVisitas(dias = 30): Promise<ResumenVisitas> {
  const { sql } = await import('drizzle-orm');

  // Serie diaria con relleno de días sin visitas
  const serieBruta = await db.execute<{ dia: string; visitas: number; unicos: number }>(sql`
    SELECT
      to_char(date_trunc('day', creado_en), 'YYYY-MM-DD') AS dia,
      COUNT(*)::int AS visitas,
      COUNT(DISTINCT ip_hash)::int AS unicos
    FROM visitas
    WHERE creado_en >= NOW() - (${dias} || ' days')::interval
    GROUP BY dia
    ORDER BY dia ASC
  `);

  // Rellenar días sin visitas
  const hoy = new Date();
  const mapa = new Map<string, { visitas: number; unicos: number }>();
  for (const f of serieBruta.rows ?? serieBruta ?? []) {
    mapa.set(f.dia, { visitas: Number(f.visitas), unicos: Number(f.unicos) });
  }
  const serie: ResumenVisitas['serie'] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const clave = d.toISOString().slice(0, 10);
    const v = mapa.get(clave) ?? { visitas: 0, unicos: 0 };
    serie.push({ dia: clave, visitas: v.visitas, unicos: v.unicos });
  }

  const total = serie.reduce((a, b) => a + b.visitas, 0);
  const unicos = serie.reduce((a, b) => a + b.unicos, 0);

  // Periodo anterior para comparar
  const anterior = await db.execute<{ total: number }>(sql`
    SELECT COUNT(*)::int AS total FROM visitas
    WHERE creado_en >= NOW() - (${dias * 2} || ' days')::interval
      AND creado_en <  NOW() - (${dias}     || ' days')::interval
  `);
  const totalAnterior = Number((anterior.rows?.[0] ?? anterior[0])?.total ?? 0);
  const vsAnterior = totalAnterior === 0 ? 0 : ((total - totalAnterior) / totalAnterior) * 100;

  const topRutas = await db.execute<{ ruta: string; visitas: number }>(sql`
    SELECT ruta, COUNT(*)::int AS visitas FROM visitas
    WHERE creado_en >= NOW() - (${dias} || ' days')::interval
    GROUP BY ruta ORDER BY visitas DESC LIMIT 5
  `);
  const topReferrers = await db.execute<{ referrer: string; visitas: number }>(sql`
    SELECT COALESCE(NULLIF(referrer, ''), 'Directo') AS referrer, COUNT(*)::int AS visitas
    FROM visitas
    WHERE creado_en >= NOW() - (${dias} || ' days')::interval
    GROUP BY referrer ORDER BY visitas DESC LIMIT 5
  `);

  return {
    serie,
    total,
    unicos,
    topRutas: (topRutas.rows ?? topRutas ?? []).map((r: any) => ({ ruta: r.ruta, visitas: Number(r.visitas) })),
    topReferrers: (topReferrers.rows ?? topReferrers ?? []).map((r: any) => ({ referrer: r.referrer, visitas: Number(r.visitas) })),
    vsAnterior,
  };
}
