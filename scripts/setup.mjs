#!/usr/bin/env node
// Setup automático: genera .env con AUTH_SECRET + DEV_ADMIN_BYPASS.
// Idempotente: si ya existe .env, no sobreescribe.

import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ejemplo = resolve(raiz, '.env.example');
const env = resolve(raiz, '.env');

const verde = (s) => `\x1b[32m${s}\x1b[0m`;
const azul = (s) => `\x1b[36m${s}\x1b[0m`;
const amar = (s) => `\x1b[33m${s}\x1b[0m`;
const gris = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(`\n${azul('●')} Kaladim · setup local\n`);

if (existsSync(env)) {
  console.log(`${amar('⚠')}  .env ya existe. No se sobreescribe.`);
  console.log(gris('   Para regenerar: rm .env && npm run setup\n'));
  process.exit(0);
}

if (!existsSync(ejemplo)) {
  console.error(`${amar('✗')} No existe .env.example`);
  process.exit(1);
}

// Copiar .env.example → .env + inyectar valores
let contenido = readFileSync(ejemplo, 'utf-8');
const secret = randomBytes(32).toString('base64');

contenido = contenido.replace(/^AUTH_SECRET=.*/m, `AUTH_SECRET=${secret}`);
// Añadir DEV_ADMIN_BYPASS si no está presente
if (!contenido.includes('DEV_ADMIN_BYPASS=')) {
  contenido += `\n# Bypass auth local — ver admin sin OAuth\nDEV_ADMIN_BYPASS=true\n`;
} else {
  contenido = contenido.replace(/^DEV_ADMIN_BYPASS=.*/m, 'DEV_ADMIN_BYPASS=true');
}

writeFileSync(env, contenido, 'utf-8');

console.log(`${verde('✓')} .env creado`);
console.log(`${verde('✓')} AUTH_SECRET generado (32 bytes random base64)`);
console.log(`${verde('✓')} DEV_ADMIN_BYPASS=true (admin accesible sin login)`);
console.log(`\n${azul('→')} Listo. Arranca con:\n   ${verde('npm run dev')}\n`);
console.log(gris('   Abre http://localhost:4321'));
console.log(gris('   Panel admin en http://localhost:4321/admin (sin login, modo dev)\n'));
console.log(gris('   Para DB real: edita .env con DATABASE_URL de Neon + npm run db:push'));
console.log(gris('   Para OAuth prod: ver sección Google OAuth en README.md\n'));
