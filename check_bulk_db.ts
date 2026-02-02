
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.bulkDeletionJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(jobs, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
