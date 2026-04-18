// Esquemas Zod centralizados por entidad.
import { z } from 'zod';

const vacioANulo = (s: unknown) => (s === '' || s === undefined ? null : s);

export const esquemaCliente = z.object({
  empresa: z.string().min(2).max(180),
  contactoNombre: z.string().min(2).max(160),
  contactoEmail: z.string().email().max(255),
  contactoTelefono: z.preprocess(vacioANulo, z.string().max(40).nullable().optional()),
  sitioWeb: z.preprocess(vacioANulo, z.string().max(255).nullable().optional()),
  sector: z.preprocess(vacioANulo, z.string().max(120).nullable().optional()),
  notas: z.preprocess(vacioANulo, z.string().nullable().optional()),
});

const fechaOpcional = z.preprocess(
  (v) => (v === '' || v == null ? null : new Date(v as string)),
  z.date().nullable().optional(),
);

export const esquemaProyecto = z.object({
  clienteId: z.string().uuid(),
  titulo: z.string().min(2).max(200),
  descripcion: z.preprocess(vacioANulo, z.string().nullable().optional()),
  estado: z.enum(['borrador', 'en_progreso', 'en_revision', 'completado', 'pausado', 'cancelado']).optional(),
  fechaInicio: fechaOpcional,
  fechaEntrega: fechaOpcional,
  presupuesto: z.preprocess(vacioANulo, z.string().nullable().optional()),
  progreso: z.coerce.number().min(0).max(100).optional(),
});

export const esquemaServicio = z.object({
  proyectoId: z.string().uuid(),
  tipo: z.enum(['web_landing', 'web_corporativa', 'web_ecommerce', 'automatizacion_n8n', 'integracion_api', 'mantenimiento', 'consultoria']),
  nombre: z.string().min(2).max(200),
  descripcion: z.preprocess(vacioANulo, z.string().nullable().optional()),
  precio: z.coerce.string(),
  recurrente: z.coerce.boolean().optional(),
  periodoMeses: z.coerce.number().int().nullable().optional(),
});

export const esquemaAutomatizacion = z.object({
  clienteId: z.string().uuid(),
  nombre: z.string().min(2).max(200),
  descripcion: z.preprocess(vacioANulo, z.string().nullable().optional()),
  workflowN8nId: z.preprocess(vacioANulo, z.string().max(120).nullable().optional()),
  urlN8n: z.preprocess(vacioANulo, z.string().url().nullable().optional()),
  estado: z.enum(['activa', 'pausada', 'error', 'desarrollo']).optional(),
});

export const esquemaCasoEstudio = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  titulo: z.string().min(2).max(120),
  anio: z.string().min(1).max(10),
  categoria: z.string().min(2).max(120),
  descripcion: z.string().min(10),
  url: z.string().min(2).max(255),
  urlLive: z.preprocess((v) => (v === '' ? null : v), z.string().max(500).nullable().optional()),
  urlCodigo: z.preprocess((v) => (v === '' ? null : v), z.string().max(500).nullable().optional()),
  // Arrays que llegan del formulario como strings separados por comas
  tecnologias: z.union([z.array(z.string()), z.string()]).transform((v) =>
    typeof v === 'string'
      ? JSON.stringify(v.split(',').map((s) => s.trim()).filter(Boolean))
      : JSON.stringify(v),
  ),
  metricas: z.union([z.string(), z.array(z.any())]).transform((v) =>
    typeof v === 'string' ? v : JSON.stringify(v),
  ),
  grafica: z.union([z.string(), z.array(z.number())]).transform((v) =>
    typeof v === 'string'
      ? JSON.stringify(v.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)))
      : JSON.stringify(v),
  ),
  orden: z.coerce.number().int().default(0),
  activo: z.coerce.boolean().default(true),
});

export const esquemaKanbanColumna = z.object({
  titulo: z.string().min(1).max(120),
  color: z.enum(['carbon', 'violeta', 'emerald', 'amber', 'red', 'cyan']).default('carbon'),
  orden: z.coerce.number().int().default(0),
});

export const esquemaKanbanTarjeta = z.object({
  columnaId: z.string().uuid(),
  titulo: z.string().min(1).max(200),
  descripcion: z.preprocess((v) => (v === '' ? null : v), z.string().nullable().optional()),
  orden: z.coerce.number().int().default(0),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
  etiquetas: z.union([z.string(), z.array(z.string())]).transform((v) =>
    typeof v === 'string' ? v : JSON.stringify(v),
  ).default('[]'),
  asignadoEmail: z.preprocess((v) => (v === '' ? null : v), z.string().email().nullable().optional()),
  fechaLimite: z.preprocess(
    (v) => (v === '' || v == null ? null : new Date(v as string)),
    z.date().nullable().optional(),
  ),
  proyectoId: z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable().optional()),
});

export const esquemaUsuario = z.object({
  email: z.string().email().max(255),
  nombre: z.string().min(2).max(120),
  rol: z.enum(['admin', 'cliente']).optional(),
});
