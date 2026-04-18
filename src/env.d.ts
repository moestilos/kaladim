/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly AUTH_SECRET: string;
  readonly AUTH_TRUST_HOST: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly ADMIN_EMAILS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    sesion?: import('@auth/core/types').Session | null;
    usuario?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      rol?: 'admin' | 'cliente';
    };
  }
}
