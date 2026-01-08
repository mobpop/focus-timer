import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Debug logging
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('CRITICAL: DATABASE_URL is missing in runtime environment');
    } else {
        console.log('DATABASE_URL found (length: ' + url.length + ')');
    }

    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
