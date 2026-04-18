// POST /api/leads — Captura lead del formulario público.
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db, esquema } from '../../lib/db/cliente';

export const prerender = false;

const esquemaLead = z.object({
  nombre: z.string().min(2).max(160),
  email: z.string().email().max(255),
  empresa: z.string().max(180).optional().or(z.literal('')),
  telefono: z.string().max(40).optional().or(z.literal('')),
  mensaje: z.string().min(10).max(4000),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const datos = await request.json();
    const validado = esquemaLead.parse(datos);

    // Si DB no configurada, devolver OK igual (útil en dev sin DB)
    if (!import.meta.env.DATABASE_URL) {
      console.log('[Lead recibido sin DB]', validado);
      return Response.json({ ok: true, modo: 'desarrollo' });
    }

    const [creado] = await db
      .insert(esquema.leads)
      .values({
        nombre: validado.nombre,
        email: validado.email,
        empresa: validado.empresa || null,
        telefono: validado.telefono || null,
        mensaje: validado.mensaje,
        origen: 'landing',
      })
      .returning({ id: esquema.leads.id });

    return Response.json({ ok: true, id: creado.id });
  } catch (error) {
    console.error('[POST /api/leads]', error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { ok: false, error: 'validacion', detalles: error.errors },
        { status: 400 },
      );
    }
    return Response.json({ ok: false, error: 'servidor' }, { status: 500 });
  }
};
