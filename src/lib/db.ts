import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create extended Prisma client with encryption middleware
 * This ensures access_token and refresh_token are always encrypted at rest
 */
function createExtendedPrismaClient() {
  const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Extend with encryption middleware
  return basePrisma.$extends({
    name: 'encryptionMiddleware',
    query: {
      // Encrypt tokens before writing to database
      account: {
        async create({ args, query }) {
          if (args.data) {
            if (args.data.access_token) {
              args.data.access_token = encrypt(args.data.access_token);
            }
            if (args.data.refresh_token) {
              args.data.refresh_token = encrypt(args.data.refresh_token);
            }
          }
          return query(args);
        },

        async createMany({ args, query }) {
          if (args.data && Array.isArray(args.data)) {
            for (const item of args.data) {
              if (item.access_token) {
                item.access_token = encrypt(item.access_token);
              }
              if (item.refresh_token) {
                item.refresh_token = encrypt(item.refresh_token);
              }
            }
          }
          return query(args);
        },

        async update({ args, query }) {
          if (args.data) {
            if (args.data.access_token && typeof args.data.access_token === 'string') {
              args.data.access_token = encrypt(args.data.access_token);
            }
            if (args.data.refresh_token && typeof args.data.refresh_token === 'string') {
              args.data.refresh_token = encrypt(args.data.refresh_token);
            }
          }
          return query(args);
        },

        async upsert({ args, query }) {
          if (args.create) {
            if (args.create.access_token && typeof args.create.access_token === 'string') {
              args.create.access_token = encrypt(args.create.access_token);
            }
            if (args.create.refresh_token && typeof args.create.refresh_token === 'string') {
              args.create.refresh_token = encrypt(args.create.refresh_token);
            }
          }
          if (args.update) {
            if (args.update.access_token && typeof args.update.access_token === 'string') {
              args.update.access_token = encrypt(args.update.access_token);
            }
            if (args.update.refresh_token && typeof args.update.refresh_token === 'string') {
              args.update.refresh_token = encrypt(args.update.refresh_token);
            }
          }
          return query(args);
        },

        // Decrypt tokens after reading from database
        async findMany({ args, query }) {
          const result = await query(args);
          if (Array.isArray(result)) {
            for (const item of result) {
              if (item.access_token) {
                item.access_token = decrypt(item.access_token);
              }
              if (item.refresh_token) {
                item.refresh_token = decrypt(item.refresh_token);
              }
            }
          }
          return result;
        },

        async findFirst({ args, query }) {
          const result = await query(args);
          if (result) {
            if (result.access_token) {
              result.access_token = decrypt(result.access_token);
            }
            if (result.refresh_token) {
              result.refresh_token = decrypt(result.refresh_token);
            }
          }
          return result;
        },

        async findUnique({ args, query }) {
          const result = await query(args);
          if (result) {
            if (result.access_token) {
              result.access_token = decrypt(result.access_token);
            }
            if (result.refresh_token) {
              result.refresh_token = decrypt(result.refresh_token);
            }
          }
          return result;
        },

        async findUniqueOrThrow({ args, query }) {
          const result = await query(args);
          if (result) {
            if (result.access_token) {
              result.access_token = decrypt(result.access_token);
            }
            if (result.refresh_token) {
              result.refresh_token = decrypt(result.refresh_token);
            }
          }
          return result;
        },
      },
    },
  }) as PrismaClient;
}

export const db =
  globalForPrisma.prisma ??
  createExtendedPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
