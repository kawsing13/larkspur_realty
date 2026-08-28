// Loads and validates environment variables once, at startup.
// If anything required is missing or malformed, the process exits with a readable
// message instead of failing deep inside a request handler later.

import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // How many reverse proxies sit in front of the app (for correct client IPs).
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  // Cross-domain deploys (client and API on different registrable domains) need
  // "none"; same-site deploys should keep "lax".
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  // Serve the Swagger UI. Unset -> on outside production; set to force it either way.
  ENABLE_API_DOCS: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v == null ? undefined : v === 'true')),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().default('rems'),
  STORAGE_SECRET_KEY: z.string().default('rems_dev_pw'),
  STORAGE_BUCKET: z.string().default('rems-media'),
  STORAGE_DOCS_BUCKET: z.string().default('rems-docs'),
  STORAGE_PUBLIC_URL: z.string().optional(),

  MAPBOX_TOKEN: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\nInvalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nCompare server/.env with server/.env.example.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Refuse to boot in production with the example secrets still in place.
if (isProd) {
  const weak = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET].some((s) =>
    s.includes('dev-only') || s.includes('change-me'),
  );
  if (weak) {
    console.error('\nRefusing to start: JWT secrets are still the example values.\n');
    process.exit(1);
  }
}

export const docsEnabled = env.ENABLE_API_DOCS ?? !isProd;
