# Kaladim — Plataforma SaaS

Agencia digital: webs profesionales + automatizaciones n8n para empresas.
Incluye web corporativa pública + panel de administración interno.

## 🛠 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | **Astro 5** (SSR) |
| Estilos | **Tailwind CSS 3** |
| Base de datos | **Neon Postgres** |
| ORM | **Drizzle** |
| Auth | **Auth.js** (Google OAuth) via `auth-astro` |
| Validación | **Zod** |
| Deploy local | `@astrojs/node` |
| Deploy producción | Vercel (`@astrojs/vercel`) |

## 📁 Estructura

```
kaladim/
├── src/
│   ├── pages/                    # rutas Astro (convención framework)
│   │   ├── index.astro           # landing pública
│   │   ├── entrar.astro          # login Google
│   │   ├── sin-acceso.astro      # 403
│   │   ├── admin/                # panel privado (protegido)
│   │   │   ├── index.astro       # dashboard con métricas
│   │   │   ├── clientes/         # CRUD completo (plantilla)
│   │   │   ├── proyectos/
│   │   │   ├── servicios/
│   │   │   ├── automatizaciones/
│   │   │   ├── usuarios/
│   │   │   └── leads/
│   │   └── api/                  # endpoints REST
│   │       ├── leads.ts          # POST público (formulario contacto)
│   │       └── clientes/         # GET/POST/PATCH/DELETE
│   ├── componentes/
│   │   ├── landing/              # Hero, Servicios, Automatizaciones, …
│   │   ├── admin/                # BarraLateral, TablaDatos, FormularioCliente, …
│   │   └── ui/                   # Boton, Logo, Insignia (primitivos)
│   ├── layouts/
│   │   ├── LayoutPublico.astro   # nav pública + footer
│   │   └── LayoutAdmin.astro     # sidebar admin
│   ├── lib/
│   │   ├── db/
│   │   │   ├── esquema.ts        # schema Drizzle (todas las tablas)
│   │   │   └── cliente.ts        # singleton conexión lazy
│   │   └── utilidades/
│   │       ├── validaciones.ts   # esquemas Zod
│   │       └── autorizacion.ts   # helper requerirAdmin()
│   ├── estilos/global.css        # Tailwind + componentes custom
│   ├── middleware.ts             # protección /admin/*
│   └── env.d.ts
├── public/
├── drizzle/                      # migraciones SQL (auto-generadas)
├── auth.config.ts                # config Google OAuth
├── astro.config.mjs
├── tailwind.config.mjs           # paleta carbon + violeta + animaciones
├── drizzle.config.ts
├── .env.example
└── package.json
```

## 🚀 Arranque rápido (local)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar env y rellenar (mínimo AUTH_SECRET para arrancar)
cp .env.example .env
# El dev server arranca sin DATABASE_URL: las páginas muestran datos de ejemplo.

# 3. Arrancar dev
npm run dev
# → http://localhost:4321
```

Sin `DATABASE_URL` verás la landing, panel admin en modo demo (datos mock), y formularios operativos pero no persistentes.

## 🗄 Configurar Neon + schema

```bash
# 1. Crea proyecto en https://neon.tech y copia la connection string.
# 2. Pégala en .env:
#    DATABASE_URL=postgres://usuario:pass@...neon.tech/kaladim?sslmode=require

# 3. Aplicar schema (push directo, dev-friendly):
npm run db:push

# O generar migración versionada:
npm run db:generate   # crea SQL en drizzle/
# Aplicar manualmente o con:
npm run db:push

# 4. Explorar datos visualmente:
npm run db:studio
```

### Tablas creadas

- `usuarios` — admins y clientes con acceso
- `clientes` — empresas contratantes
- `proyectos` — entregables por cliente
- `servicios_contratados` — líneas de servicio por proyecto
- `automatizaciones` — flujos n8n vinculados a clientes
- `leads` — contactos capturados desde la web
- Enums: `rol_usuario`, `estado_proyecto`, `tipo_servicio`, `estado_automatizacion`

## 🔐 Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Crear **OAuth Client ID** tipo "Web application".
3. URIs autorizadas:
   - **Origen:** `http://localhost:4321` (dev) · `https://tu-dominio.com` (prod)
   - **Redirect:** `http://localhost:4321/api/auth/callback/google` · equivalente prod
4. Copiar `Client ID` y `Client Secret` a `.env`.
5. Añadir tu email a `ADMIN_EMAILS` (coma-separados) para obtener rol admin.
6. Generar `AUTH_SECRET`: `openssl rand -base64 32`.

## ☁ Deploy en Vercel

1. Cambiar adapter en `astro.config.mjs`:

```js
import vercel from '@astrojs/vercel';
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind({ applyBaseStyles: false }), auth()],
});
```

2. Push del repo a GitHub.
3. Importar en Vercel, añadir las env vars (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_*`, `ADMIN_EMAILS`).
4. Deploy automático.

> Neon se integra nativamente con Vercel: activa la extensión y conecta el proyecto.

## 🧩 CRUD completo vs plantilla

**Clientes** está implementado 100%: listado, crear, editar, eliminar, API REST.
Úsalo como **plantilla** para replicar `proyectos`, `servicios`, `automatizaciones`, `usuarios`:

1. Copiar `src/componentes/admin/FormularioCliente.astro` → `FormularioXxx.astro`, ajustar campos.
2. Copiar `src/pages/admin/clientes/{index,nuevo,[id]}.astro` → carpeta equivalente.
3. Copiar `src/pages/api/clientes/{index,[id]}.ts` → API de la nueva entidad.
4. Usar el esquema Zod correspondiente de `src/lib/utilidades/validaciones.ts`.

## 🎨 Paleta y sistema de diseño

- `carbon-*` — escala de grises fríos (fondos, bordes)
- `violeta-*` — acento principal `#7C3AED`
- Utilidades: `.tarjeta`, `.tarjeta-glass`, `.btn-primario`, `.texto-gradiente`, `.brillo-violeta`, `.fondo-grid`
- Animaciones custom: `animate-aparecer`, `animate-flotar`, `animate-brillar`

## 🧠 Ideas de evolución SaaS

- Portal cliente: cada empresa ve sus proyectos/facturas
- Facturación automática (Stripe + n8n)
- Integración webhook con n8n para sync automático de métricas `ejecucionesTotales`
- Marketplace de plantillas de automatización
- Multi-tenancy (organizaciones con múltiples usuarios)
- Feed de actividad en tiempo real (Server-Sent Events)
- Panel de métricas avanzado (Recharts + Drizzle queries)

## 📜 Comandos

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Dev server en :4321 |
| `npm run build` | Build producción |
| `npm run preview` | Preview local del build |
| `npm run db:push` | Aplicar schema a Neon |
| `npm run db:generate` | Generar migración SQL |
| `npm run db:studio` | UI web para explorar DB |

---

Hecho con ❤ para clientes reales.
