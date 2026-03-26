import { z } from 'zod';

const envSchema = z.object({
  ENCRYPTION_KEY: z.string().min(32),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
