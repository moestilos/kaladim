# 🪐 Kaladim

> **Plataforma SaaS full-stack para una agencia digital.**
> Landing pública + panel admin con gestión de proyectos, ideario, analíticas, kanban y roles.

🔗 **Producción:** [kaladim.vercel.app](https://kaladim.vercel.app)
📦 **Repo:** [github.com/moestilos/kaladim](https://github.com/moestilos/kaladim)

---

## 🎯 Qué hace

### Web pública
- Landing con hero split, servicios, apps lanzadas (case studies editables),
  sección visual n8n, beneficios, proceso, captura de leads.
- Paleta de 9 temas de color (cambiables en vivo con ⌘K).
- Fondo animado tipo constelación reactivo al mouse.
- Formulario contacto → tabla `leads`.

### Panel admin (`/admin`)
- **Dashboard** — métricas + gráfica visitas 7/30/90 días + top páginas/referrers.
- **Clientes** — CRUD completo (empresa, contacto, sector, notas).
- **Proyectos** — CRUD + cliente asociado, estado lifecycle, presupuesto, progreso.
- **Servicios** — CRUD + proyecto asociado, tipo, precio, recurrencia.
- **Apps lanzadas** — CRUD portfolio con editor de sparklines, métricas editables, pills tech.
- **Kanban** — columnas personalizables, drag & drop (DnD desktop + botones ↑↓←→ móvil),
  vínculo tarjeta ↔ proyecto, polling 8s sincroniza entre pestañas.
- **Ideario** — captura rápida, scoring impacto×esfuerzo, voto único por admin,
  matriz de priorización 2D (Quick Wins / Big Bets / Fill-ins / Time Sinks),
  convertir idea en proyecto.
- **Usuarios y roles** — 4 roles (admin / editor / viewer / cliente),
  invitar por email, cambio de rol inline, toggle activo.
- **Mi perfil** — nombre, alias, teléfono, bio, upload de foto (resize 256×256 webp).
- **Leads** — listado con búsqueda.

### Sistema
- **Auth** Google OAuth (Auth.js) + superuser hardcoded.
- **Analytics propias** — middleware tracking con hash de IP (privacidad),
  agregación 7/30/90d, top rutas + referrers, detección de bots.
- **Paleta de comandos** ⌘K — navegación + cambio tema instantáneo.
- **Modo dev local:** `DEV_ADMIN_BYPASS=true` en `.env` para ver admin sin OAuth.

---

## 🛠 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | **Astro 5** (SSR) |
| Estilos | **Tailwind CSS 3** (CSS vars para temas) |
| DB | **Neon Postgres** (serverless) |
| ORM | **Drizzle** + drizzle-kit |
| Auth | **Auth.js** + `auth-astro` (Google OAuth) |
| Validación | **Zod** |
| Deploy | **Vercel** (serverless functions) |
| Tipografías | Satoshi (Fontshare) + Instrument Serif + JetBrains Mono |

---

## 📁 Estructura

```
src/
├── pages/                      # Rutas (Astro convention)
│   ├── index.astro             # Landing
│   ├── entrar.astro            # Login Google
│   ├── sin-acceso.astro
│   ├── admin/                  # Panel privado (middleware protege)
│   │   ├── index.astro         # Dashboard
│   │   ├── clientes/           # CRUD
│   │   ├── proyectos/          # CRUD
│   │   ├── servicios/          # CRUD
│   │   ├── casos/              # CRUD "Apps lanzadas"
│   │   ├── kanban.astro        # Tablero realtime
│   │   ├── ideas/              # Ideario
│   │   ├── usuarios/           # Gestión + roles
│   │   ├── perfil.astro        # Propio perfil
│   │   ├── automatizaciones/   # Stub
│   │   └── leads/              # Listado
│   └── api/                    # Endpoints REST (GET/POST/PATCH/DELETE)
│       ├── leads.ts            # POST público (form contacto)
│       ├── clientes/           # CRUD
│       ├── proyectos/          # CRUD
│       ├── servicios/          # CRUD
│       ├── casos/              # CRUD apps
│       ├── ideas/              # CRUD + votar + convertir
│       ├── kanban/             # CRUD + reordenar
│       ├── usuarios/           # CRUD (admin estricto)
│       ├── perfil.ts           # GET/PATCH propio
│       ├── estadisticas/       # Analytics agregadas
│       └── auth/               # Auth.js endpoints
│
├── componentes/
│   ├── landing/                # Hero, Servicios, CasosEstudio, etc.
│   ├── admin/                  # BarraLateral, TablaDatos, formularios, GraficaVisitas
│   └── ui/                     # Logo, Boton, Insignia, FondoConstelacion, PaletaComandos
│
├── layouts/
│   ├── LayoutPublico.astro     # Nav pill + footer + constelación
│   └── LayoutAdmin.astro       # Sidebar + header + paleta
│
├── lib/
│   ├── db/
│   │   ├── esquema.ts          # Tablas Drizzle (11+ tablas)
│   │   └── cliente.ts          # Conexión lazy Neon
│   └── utilidades/
│       ├── autorizacion.ts     # obtenerAdmin / requerirAdmin / requerirAdminEstricto
│       ├── validaciones.ts     # Esquemas Zod por entidad
│       └── analiticas.ts       # Tracking visitas + agregaciones
│
├── estilos/global.css          # Tailwind + temas CSS vars + clases reutilizables
└── middleware.ts               # Auth + upsert usuario + tracking + patch URL Vercel

auth.config.ts                  # Google OAuth config + superadmin hardcoded
drizzle.config.ts               # drizzle-kit config
astro.config.mjs                # Astro + Vercel adapter + security
tailwind.config.mjs             # Paleta acento via var(--acento-*)
```

---

## 🚀 Empezar en local (5 min)

### 1. Requisitos
- Node 20+
- Cuenta Neon (gratis, [neon.tech](https://neon.tech))
- Cuenta Google Cloud (solo si quieres OAuth real, opcional para dev)

### 2. Clonar e instalar

```bash
git clone https://github.com/moestilos/kaladim.git
cd kaladim
npm install
```

### 3. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env`. Mínimo para dev sin auth:

```env
AUTH_SECRET=cambiar-cualquier-string-largo-aleatorio
DEV_ADMIN_BYPASS=true
```

Con eso entras al admin sin login: `http://localhost:4321/admin`.

### 4. (Opcional) Conectar DB

Para persistencia real:

```env
DATABASE_URL=postgres://user:pass@xxx.neon.tech/neondb?sslmode=require
```

Aplicar schema:

```bash
npm run db:push    # crea todas las tablas en Neon
```

### 5. Arrancar

```bash
npm run dev
```

→ `http://localhost:4321`

---

## 🔐 Auth Google (para producción)

1. [Google Cloud Console](https://console.cloud.google.com) → New Project → "Kaladim"
2. APIs & Services → OAuth consent screen → **External** → Test users: tu email
3. Credentials → Create OAuth Client ID → **Web application**
   - Authorized JavaScript origins: `https://tudominio.com`, `http://localhost:4321`
   - Authorized redirect URIs: `https://tudominio.com/api/auth/callback/google` (+ localhost)
4. Añadir al `.env` de Vercel:

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
ADMIN_EMAILS=tu@email.com,otro@email.com
AUTH_URL=https://tudominio.com/api/auth
AUTH_TRUST_HOST=true
AUTH_SECRET=xxxx     # openssl rand -base64 32
DEV_ADMIN_BYPASS=false
```

**Superuser hardcoded:** `gmateosoficial@gmail.com` siempre es admin (ver `src/middleware.ts`).
Cambiar el email ahí si eres otra persona manteniendo este repo.

---

## 👥 Sistema de roles

| Rol | Accede panel | Crea/edita | Gestiona usuarios |
|-----|-------------|-----------|-------------------|
| `admin` | ✅ | ✅ | ✅ |
| `editor` | ✅ | ✅ | ❌ |
| `viewer` | ✅ (solo lectura) | ❌ | ❌ |
| `cliente` | ❌ | ❌ | ❌ |

- **Primer usuario** que entra → auto-admin (bootstrap).
- **Superuser** hardcoded (ver arriba) → siempre admin aunque alguien le cambie rol.
- Los nuevos usuarios invitados por email acceden al hacer login con Google usando ese email.
- Cambio de rol vía `/admin/usuarios` (solo admin).

---

## 🎨 Temas de color

9 paletas en `src/estilos/global.css` como `:root[data-tema="x"]`. Todo el UI acento
(botones, badges, gráficas, constelación, logo) resuelve vía `rgb(var(--acento-*))`
→ cambio instantáneo sin recargar.

- `violeta` (default) · `neon` (verde neón) · `verde` esmeralda
- `cian` · `azul` · `rosa` · `amarillo` · `naranja` · `rojo`

Cambiar desde **⌘K → Tema de color**.

---

## 📜 Comandos

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Dev server :4321 |
| `npm run build` | Build producción |
| `npm run db:push` | Aplicar schema a Neon (sync, sin migración) |
| `npm run db:generate` | Generar migración SQL versionada |
| `npm run db:studio` | UI navegador para explorar DB |

---

## 🧩 Tablas principales (Drizzle)

```
usuarios              — login + rol + datos perfil (bio, telefono, avatar, nombreUsuario)
clientes              — empresas contratantes
proyectos             — entregables (FK cliente)
servicios_contratados — líneas de servicio (FK proyecto)
casos_estudio         — portfolio (slug, métricas JSON, sparkline)
ideas                 — roadmap (impacto, esfuerzo, estado lifecycle)
idea_votos            — voto único por usuario (unique idea_id + email)
kanban_columnas       — columnas tablero
kanban_tarjetas       — tarjetas (FK columna, proyecto opcional)
leads                 — contactos web pública
visitas               — analytics (ip_hash, ruta, referrer, país)
configuracion_sitio   — clave/valor (futuro: textos landing editables)
```

Enums: `rol_usuario`, `estado_proyecto`, `tipo_servicio`, `estado_automatizacion`,
`prioridad_tarjeta`, `tipo_idea`, `estado_idea`.

---

## 🧠 Patrones clave

### Proteger una ruta API
```ts
import { obtenerAdmin, requerirAdminEstricto } from '@/lib/utilidades/autorizacion';

export const POST: APIRoute = async ({ request }) => {
  const auth = await obtenerAdmin(request);
  if (auth instanceof Response) return auth;   // 401/403
  // auth.email / auth.rol / auth.nombre disponibles
  // ...
};

// Para acciones sensibles (solo rol admin):
const err = await requerirAdminEstricto(request);
if (err) return err;
```

### Middleware protege `/admin/*`
- Redirige a `/entrar` si no hay sesión.
- Upsert usuario en DB en cada request (nombre, avatar, último acceso).
- Aplica rol desde DB (sobreescribe token).
- `context.locals.usuario` disponible en todas las páginas admin.

### Temas con CSS vars
En vez de `bg-purple-600` usa `bg-violeta-600`. Tailwind config mapea
`violeta-X` → `rgb(var(--acento-X) / <alpha-value>)`. Cambiar el atributo
`data-tema` en `<html>` → toda la UI se actualiza.

---

## 🚢 Deploy en Vercel

1. Push a GitHub.
2. Vercel dashboard → Import → conectar repo.
3. Storage → Create Database → **Neon** → conectar al proyecto (auto-inyecta `DATABASE_URL`).
4. Settings → Environment Variables → añadir las de auth (ver arriba).
5. Deploy automático en cada push a `main`.

**Adapter:** ya configurado `@astrojs/vercel` en `astro.config.mjs`.
El middleware incluye un fix específico para Vercel (reescribe request URL
desde headers `x-forwarded-host` porque Auth.js veía `https://localhost/...`).

---

## 🤝 Contribuir

1. Rama desde `main`: `git checkout -b feat/xxx`
2. Los commits usan Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
3. PR hacia `main`. Cada merge a `main` → deploy automático.
4. Si modificas schema Drizzle (`src/lib/db/esquema.ts`):
   - Local: `npm run db:push` (o `db:generate` + revisar SQL).
   - Prod: Vercel no corre migraciones automáticas. Haz `npm run db:push`
     localmente contra la URL de prod (o usa Drizzle Studio).

---

## 📝 Notas técnicas

- **Auth.js + Vercel:** hubo que parchear URL en middleware porque
  `request.url` llegaba como `https://localhost/...`. Ver `src/middleware.ts`.
- **Astro security.checkOrigin:** desactivado en `astro.config.mjs` porque
  bloqueaba POSTs de Auth.js (CSRF del propio Auth.js ya protege).
- **Avatar upload:** cliente redimensiona a 256×256 webp y guarda como data URL
  en DB (evita depender de Vercel Blob o servicio externo).
- **Polling kanban:** 8s con locks (pausa si estás arrastrando o con modal abierto).

---

## 🪪 Créditos

Diseñado y desarrollado por **[moestilos](https://github.com/moestilos)**
· [Portfolio](https://moestilos-git-main-moestilos-projects.vercel.app/)

Hecho con ❤ y café ☕.
