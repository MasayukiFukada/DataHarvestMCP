import { PrismaClient } from './generated/client/index.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file is in the same directory as this file (packages/db/index.ts)
// during development, but Prisma Client might be running from elsewhere.
// Assuming dev.db is in packages/db/dev.db
const dbPath = path.resolve(__dirname, 'dev.db')

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })

// Singleton pattern: ensure PrismaClient is only created once
// This prevents connection pool exhaustion during development hot-reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export * from './generated/client/index.js'
