import { PrismaClient } from "@prisma/client"

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => new PrismaClient()

const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: PrismaClient
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

globalForPrisma.prisma = db
