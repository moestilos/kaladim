// Cliente Drizzle — singleton para conexión a Neon Postgres.
// Lazy: no conecta hasta el primer uso, así dev server arranca sin DATABASE_URL.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as esquema from './esquema';

type ClienteDrizzle = ReturnType<typeof drizzle<typeof esquema>>;

let cache: { sql: ReturnType<typeof postgres>; db: ClienteDrizzle } | null = null;

function crearCliente(): ClienteDrizzle {
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[Kaladim DB] Falta DATABASE_URL. Configura .env con la cadena de conexión Neon.',
    );
  }
  if (cache) return cache.db;
  const sql = postgres(url, {
    max: 1,
    prepare: false,
  });
  const db = drizzle(sql, { schema: esquema });
  cache = { sql, db };
  return db;
}

// Proxy que inicializa bajo demanda
export const db: ClienteDrizzle = new Proxy({} as ClienteDrizzle, {
  get(_target, prop, receiver) {
    const cliente = crearCliente();
    const valor = Reflect.get(cliente as object, prop, receiver);
    return typeof valor === 'function' ? valor.bind(cliente) : valor;
  },
});

export { esquema };
