import { z } from 'zod';

const envSchema = z.object({
  ENCRYPTION_KEY: z.string().min(32),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

// Lazy validation — only parses at first runtime access, not during next build
// static analysis. Avoids build failures when env vars are absent in CI.
let _env: z.infer<typeof envSchema> | undefined;

export function getEnv(): z.infer<typeof envSchema> {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

// Convenience alias for existing imports
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
