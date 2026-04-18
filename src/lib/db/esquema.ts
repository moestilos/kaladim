// Esquema de base de datos — Kaladim
// Usa Drizzle ORM con Postgres (Neon).
// Todas las tablas en español para coherencia con el panel admin.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── ENUMS ──────────────────────────────────────────────────────────────

export const rolUsuarioEnum = pgEnum('rol_usuario', ['admin', 'cliente']);

export const estadoProyectoEnum = pgEnum('estado_proyecto', [
  'borrador',
  'en_progreso',
  'en_revision',
  'completado',
  'pausado',
  'cancelado',
]);

export const tipoServicioEnum = pgEnum('tipo_servicio', [
  'web_landing',
  'web_corporativa',
  'web_ecommerce',
  'automatizacion_n8n',
  'integracion_api',
  'mantenimiento',
  'consultoria',
]);

export const estadoAutomatizacionEnum = pgEnum('estado_automatizacion', [
  'activa',
  'pausada',
  'error',
  'desarrollo',
]);

// ─── USUARIOS ───────────────────────────────────────────────────────────

export const usuarios = pgTable(
  'usuarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    avatarUrl: text('avatar_url'),
    rol: rolUsuarioEnum('rol').notNull().default('cliente'),
    googleId: varchar('google_id', { length: 120 }).unique(),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('usuarios_email_idx').on(t.email),
  }),
);

// ─── CLIENTES (empresas contratantes) ───────────────────────────────────

export const clientes = pgTable(
  'clientes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    empresa: varchar('empresa', { length: 180 }).notNull(),
    contactoNombre: varchar('contacto_nombre', { length: 160 }).notNull(),
    contactoEmail: varchar('contacto_email', { length: 255 }).notNull(),
    contactoTelefono: varchar('contacto_telefono', { length: 40 }),
    sitioWeb: varchar('sitio_web', { length: 255 }),
    sector: varchar('sector', { length: 120 }),
    notas: text('notas'),
    usuarioId: uuid('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    empresaIdx: index('clientes_empresa_idx').on(t.empresa),
    emailIdx: index('clientes_email_idx').on(t.contactoEmail),
  }),
);

// ─── PROYECTOS ──────────────────────────────────────────────────────────

export const proyectos = pgTable(
  'proyectos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    estado: estadoProyectoEnum('estado').notNull().default('borrador'),
    fechaInicio: timestamp('fecha_inicio', { withTimezone: true }),
    fechaEntrega: timestamp('fecha_entrega', { withTimezone: true }),
    presupuesto: numeric('presupuesto', { precision: 12, scale: 2 }),
    progreso: integer('progreso').notNull().default(0), // 0-100
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    clienteIdx: index('proyectos_cliente_idx').on(t.clienteId),
    estadoIdx: index('proyectos_estado_idx').on(t.estado),
  }),
);

// ─── SERVICIOS CONTRATADOS ──────────────────────────────────────────────

export const serviciosContratados = pgTable(
  'servicios_contratados',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id, { onDelete: 'cascade' }),
    tipo: tipoServicioEnum('tipo').notNull(),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    precio: numeric('precio', { precision: 12, scale: 2 }).notNull(),
    recurrente: boolean('recurrente').notNull().default(false),
    periodoMeses: integer('periodo_meses'),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    proyectoIdx: index('servicios_proyecto_idx').on(t.proyectoId),
  }),
);

// ─── AUTOMATIZACIONES (n8n) ─────────────────────────────────────────────

export const automatizaciones = pgTable(
  'automatizaciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    workflowN8nId: varchar('workflow_n8n_id', { length: 120 }),
    urlN8n: text('url_n8n'),
    estado: estadoAutomatizacionEnum('estado').notNull().default('desarrollo'),
    ejecucionesTotales: integer('ejecuciones_totales').notNull().default(0),
    ejecucionesExitosas: integer('ejecuciones_exitosas').notNull().default(0),
    ultimaEjecucion: timestamp('ultima_ejecucion', { withTimezone: true }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    clienteIdx: index('automatizaciones_cliente_idx').on(t.clienteId),
  }),
);

// ─── CASOS DE ESTUDIO (portfolio editable) ──────────────────────────────

export const casosEstudio = pgTable(
  'casos_estudio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Slug visible en URL (ej: "moepdf")
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    titulo: varchar('titulo', { length: 120 }).notNull(),
    anio: varchar('anio', { length: 10 }).notNull(),
    categoria: varchar('categoria', { length: 120 }).notNull(),
    descripcion: text('descripcion').notNull(),
    url: varchar('url', { length: 255 }).notNull(),
    urlLive: varchar('url_live', { length: 500 }),
    urlCodigo: varchar('url_codigo', { length: 500 }),
    // Arrays serializados como JSON text (simple y portable)
    tecnologias: text('tecnologias').notNull().default('[]'), // string[]
    metricas: text('metricas').notNull().default('[]'),       // {etiqueta,valor,sub?,acento?}[]
    grafica: text('grafica').notNull().default('[]'),         // number[] (16 valores 0-100)
    orden: integer('orden').notNull().default(0),
    activo: boolean('activo').notNull().default(true),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index('casos_slug_idx').on(t.slug),
    ordenIdx: index('casos_orden_idx').on(t.orden),
  }),
);

// ─── CONFIGURACIÓN SITIO (textos hero, stats, etc — clave/valor) ────────

export const configuracionSitio = pgTable('configuracion_sitio', {
  clave: varchar('clave', { length: 80 }).primaryKey(),
  valor: text('valor').notNull(), // JSON serializado
  descripcion: varchar('descripcion', { length: 255 }),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
});

// ─── KANBAN (gestión tipo Trello) ───────────────────────────────────────

export const prioridadEnum = pgEnum('prioridad_tarjeta', ['baja', 'media', 'alta', 'urgente']);

export const kanbanColumnas = pgTable(
  'kanban_columnas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titulo: varchar('titulo', { length: 120 }).notNull(),
    color: varchar('color', { length: 20 }).notNull().default('carbon'), // carbon|violeta|emerald|amber|red|cyan
    orden: integer('orden').notNull().default(0),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ordenIdx: index('kanban_columnas_orden_idx').on(t.orden),
  }),
);

export const kanbanTarjetas = pgTable(
  'kanban_tarjetas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    columnaId: uuid('columna_id')
      .notNull()
      .references(() => kanbanColumnas.id, { onDelete: 'cascade' }),
    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    orden: integer('orden').notNull().default(0),
    prioridad: prioridadEnum('prioridad').notNull().default('media'),
    etiquetas: text('etiquetas').notNull().default('[]'), // JSON string[]
    asignadoEmail: varchar('asignado_email', { length: 255 }),
    fechaLimite: timestamp('fecha_limite', { withTimezone: true }),
    proyectoId: uuid('proyecto_id').references(() => proyectos.id, { onDelete: 'set null' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    columnaIdx: index('kanban_tarjetas_columna_idx').on(t.columnaId),
    ordenIdx: index('kanban_tarjetas_orden_idx').on(t.orden),
  }),
);

// ─── IDEARIO (tabla de ideas / roadmap interno) ─────────────────────────

export const tipoIdeaEnum = pgEnum('tipo_idea', ['feature', 'mejora', 'bug', 'cliente', 'interno']);
export const estadoIdeaEnum = pgEnum('estado_idea', [
  'idea',          // capturada, sin revisar
  'considerando',  // en evaluación
  'planificada',   // aceptada, pendiente de ejecutar
  'en_progreso',
  'implementada',
  'descartada',
]);

export const ideas = pgTable(
  'ideas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    tipo: tipoIdeaEnum('tipo').notNull().default('feature'),
    estado: estadoIdeaEnum('estado').notNull().default('idea'),
    impacto: integer('impacto').notNull().default(3),       // 1-5
    esfuerzo: integer('esfuerzo').notNull().default(3),     // 1-5
    votos: integer('votos').notNull().default(0),
    etiquetas: text('etiquetas').notNull().default('[]'),   // JSON string[]
    proyectoId: uuid('proyecto_id').references(() => proyectos.id, { onDelete: 'set null' }),
    creadoPorEmail: varchar('creado_por_email', { length: 255 }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    estadoIdx: index('ideas_estado_idx').on(t.estado),
    votosIdx: index('ideas_votos_idx').on(t.votos),
  }),
);

// ─── VISITAS (analytics propios) ────────────────────────────────────────

export const visitas = pgTable(
  'visitas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ruta: varchar('ruta', { length: 500 }).notNull(),
    ipHash: varchar('ip_hash', { length: 64 }), // SHA-256 trunc de IP+UA (privacidad)
    referrer: varchar('referrer', { length: 500 }),
    userAgent: varchar('user_agent', { length: 500 }),
    pais: varchar('pais', { length: 4 }),
    sesionId: varchar('sesion_id', { length: 64 }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    fechaIdx: index('visitas_fecha_idx').on(t.creadoEn),
    rutaIdx: index('visitas_ruta_idx').on(t.ruta),
    ipHashIdx: index('visitas_ip_idx').on(t.ipHash),
  }),
);

// ─── LEADS (capturados desde landing) ───────────────────────────────────

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 160 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  empresa: varchar('empresa', { length: 180 }),
  telefono: varchar('telefono', { length: 40 }),
  mensaje: text('mensaje'),
  origen: varchar('origen', { length: 80 }).default('landing'),
  procesado: boolean('procesado').notNull().default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

// ─── RELACIONES ─────────────────────────────────────────────────────────

export const usuariosRelaciones = relations(usuarios, ({ many }) => ({
  clientes: many(clientes),
}));

export const clientesRelaciones = relations(clientes, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [clientes.usuarioId], references: [usuarios.id] }),
  proyectos: many(proyectos),
  automatizaciones: many(automatizaciones),
}));

export const proyectosRelaciones = relations(proyectos, ({ one, many }) => ({
  cliente: one(clientes, { fields: [proyectos.clienteId], references: [clientes.id] }),
  servicios: many(serviciosContratados),
}));

export const serviciosRelaciones = relations(serviciosContratados, ({ one }) => ({
  proyecto: one(proyectos, {
    fields: [serviciosContratados.proyectoId],
    references: [proyectos.id],
  }),
}));

export const automatizacionesRelaciones = relations(automatizaciones, ({ one }) => ({
  cliente: one(clientes, {
    fields: [automatizaciones.clienteId],
    references: [clientes.id],
  }),
}));

// ─── TIPOS INFERIDOS ────────────────────────────────────────────────────

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type NuevoCliente = typeof clientes.$inferInsert;
export type Proyecto = typeof proyectos.$inferSelect;
export type NuevoProyecto = typeof proyectos.$inferInsert;
export type ServicioContratado = typeof serviciosContratados.$inferSelect;
export type NuevoServicioContratado = typeof serviciosContratados.$inferInsert;
export type Automatizacion = typeof automatizaciones.$inferSelect;
export type NuevaAutomatizacion = typeof automatizaciones.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NuevoLead = typeof leads.$inferInsert;
export type CasoEstudio = typeof casosEstudio.$inferSelect;
export type NuevoCasoEstudio = typeof casosEstudio.$inferInsert;
export type ConfiguracionSitio = typeof configuracionSitio.$inferSelect;
export type KanbanColumna = typeof kanbanColumnas.$inferSelect;
export type NuevaKanbanColumna = typeof kanbanColumnas.$inferInsert;
export type KanbanTarjeta = typeof kanbanTarjetas.$inferSelect;
export type NuevaKanbanTarjeta = typeof kanbanTarjetas.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NuevaIdea = typeof ideas.$inferInsert;
