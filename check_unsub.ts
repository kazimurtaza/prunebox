
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const attempts = await prisma.unsubscriptionAttempt.findMany({
        orderBy: { attemptedAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(attempts, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
