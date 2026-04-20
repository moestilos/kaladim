#!/usr/bin/env node
// Genera iconos PWA (PNG) desde el SVG fuente.
// Corre: node scripts/gen-icons.mjs

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgRuta = resolve(raiz, 'public/favicon.svg');
const out = resolve(raiz, 'public/icons');
if (!existsSync(out)) mkdirSync(out, { recursive: true });

// SVG fuente: tiene viewBox 24x24 con constelación K fina.
// Para favicon va bien, pero pa' icono PWA (192/512) queda muy pequeño.
// Envolvemos en un SVG 512x512 con fondo violeta + constelación escalada al centro.
const svgOriginal = readFileSync(svgRuta, 'utf-8');
const svgPwa = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#4C1D95"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgG)"/>
  <g transform="translate(128 128) scale(10.67)">
    <g stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.7" fill="none">
      <line x1="6" y1="4" x2="6" y2="12"/>
      <line x1="6" y1="12" x2="6" y2="20"/>
      <line x1="6" y1="12" x2="17" y2="4"/>
      <line x1="6" y1="12" x2="17" y2="20"/>
    </g>
    <g fill="#ffffff">
      <circle cx="6" cy="4" r="1.6"/>
      <circle cx="6" cy="20" r="1.6"/>
      <circle cx="17" cy="4" r="1.6"/>
      <circle cx="17" cy="20" r="1.6"/>
      <circle cx="6" cy="12" r="2.4"/>
    </g>
  </g>
</svg>`;

// SVG maskable (safe zone centrada, bg extendido para mask circular Android)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7C3AED"/>
  <g transform="translate(160 160) scale(8.5)">
    <g stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.7" fill="none">
      <line x1="6" y1="4" x2="6" y2="12"/>
      <line x1="6" y1="12" x2="6" y2="20"/>
      <line x1="6" y1="12" x2="17" y2="4"/>
      <line x1="6" y1="12" x2="17" y2="20"/>
    </g>
    <g fill="#ffffff">
      <circle cx="6" cy="4" r="1.6"/>
      <circle cx="6" cy="20" r="1.6"/>
      <circle cx="17" cy="4" r="1.6"/>
      <circle cx="17" cy="20" r="1.6"/>
      <circle cx="6" cy="12" r="2.4"/>
    </g>
  </g>
</svg>`;

const tareas = [
  { svg: svgPwa,       tam: 192, nombre: 'icon-192.png' },
  { svg: svgPwa,       tam: 512, nombre: 'icon-512.png' },
  { svg: svgPwa,       tam: 180, nombre: 'apple-touch-icon.png' },
  { svg: svgMaskable,  tam: 512, nombre: 'icon-maskable-512.png' },
];

for (const t of tareas) {
  await sharp(Buffer.from(t.svg))
    .resize(t.tam, t.tam)
    .png({ compressionLevel: 9 })
    .toFile(resolve(out, t.nombre));
  console.log('✓', t.nombre);
}

console.log('\nIconos generados en public/icons/');
