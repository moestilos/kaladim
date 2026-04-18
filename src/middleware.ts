// Middleware global: tracking visitas + protección /admin + parche URL auth (Vercel fix).

import { defineMiddleware, sequence } from 'astro:middleware';
import { Auth } from '@auth/core';
import { getSession } from 'auth-astro/server';
import authConfig from '../auth.config';
import { hashearIp, obtenerIp, esBot, registrarVisitaAsync } from './lib/utilidades/analiticas';

const EXCLUIR_TRACKING = /^\/(admin|api|_astro|_image|_server-islands|favicon|sin-acceso|entrar)/i;

// ─── Patch URL auth ──────────────────────────────────────────────────
// auth-astro 4.2 + Vercel: request.url llega como https://localhost/... rompiendo OAuth.
// Reconstruimos la Request con host real desde x-forwarded-host antes de Auth.js.
const middlewareAuthFix = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith('/api/auth/')) return next();

  const host = context.request.headers.get('x-forwarded-host')
    || context.request.headers.get('host')
    || url.host;
  const proto = context.request.headers.get('x-forwarded-proto')
    || (url.protocol.replace(':', ''));

  const urlCorrecta = `${proto}://${host}${url.pathname}${url.search}`;
  if (urlCorrecta === context.request.url) return next();

  const init: RequestInit & { duplex?: string } = {
    method: context.request.method,
    headers: context.request.headers,
  };
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = await context.request.arrayBuffer();
  }
  const requestPatched = new Request(urlCorrecta, init);

  return Auth(requestPatched, authConfig);
});

// ─── Tracking visitas + protección admin ─────────────────────────────
const middlewareApp = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const metodo = context.request.method;

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
    } catch { /* silencioso */ }
  }

  const esRutaAdmin = url.pathname.startsWith('/admin');
  if (!esRutaAdmin) return next();

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
  // @ts-expect-error
  const rol = sesion.user.rol;
  if (rol !== 'admin') return context.redirect('/sin-acceso');

  context.locals.sesion = sesion;
  // @ts-expect-error
  context.locals.usuario = sesion.user;
  return next();
});

export const onRequest = sequence(middlewareAuthFix, middlewareApp);
