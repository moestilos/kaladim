// Middleware de protección de rutas.
// Bloquea /admin/* para usuarios no autenticados o sin rol admin.

import { defineMiddleware } from 'astro:middleware';
import { getSession } from 'auth-astro/server';
import { hashearIp, obtenerIp, esBot, registrarVisitaAsync } from './lib/utilidades/analiticas';

// Rutas excluidas de tracking (assets, api, admin, Astro internals)
const EXCLUIR_TRACKING = /^\/(admin|api|_astro|_image|_server-islands|favicon|sin-acceso|entrar)/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const metodo = context.request.method;

  // ─── Tracking de visitas (fire-and-forget, no bloquea) ───
  if (metodo === 'GET' && !EXCLUIR_TRACKING.test(url.pathname)) {
    try {
      const headers = context.request.headers;
      const ua = headers.get('user-agent') ?? '';
      if (!esBot(ua)) {
        const ip = obtenerIp(context.request, headers);
        registrarVisitaAsync({
          ruta: url.pathname,
          ipHash: hashearIp(ip, ua),
          referrer: headers.get('referer') || null,
          userAgent: ua,
          pais: headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || null,
        });
      }
    } catch {
      // nunca rompe la respuesta
    }
  }

  const esRutaAdmin = url.pathname.startsWith('/admin');

  if (!esRutaAdmin) return next();

  // ─── Bypass DEV: variable DEV_ADMIN_BYPASS=true (solo local) ───
  const bypass = import.meta.env.DEV_ADMIN_BYPASS === 'true' || process.env.DEV_ADMIN_BYPASS === 'true';
  if (bypass && import.meta.env.DEV) {
    context.locals.usuario = {
      id: 'dev-admin',
      email: 'dev@kaladim.local',
      name: 'Admin Dev',
      image: null,
      rol: 'admin',
    };
    return next();
  }

  const sesion = await getSession(context.request);

  if (!sesion?.user) {
    return context.redirect('/entrar?volver=' + encodeURIComponent(url.pathname));
  }

  // @ts-expect-error – rol añadido en callbacks
  const rol = sesion.user.rol;
  if (rol !== 'admin') {
    return context.redirect('/sin-acceso');
  }

  context.locals.sesion = sesion;
  // @ts-expect-error
  context.locals.usuario = sesion.user;

  return next();
});
