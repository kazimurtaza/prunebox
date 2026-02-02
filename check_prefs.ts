
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const prefs = await prisma.subscriptionPreference.findMany({
        where: { action: 'unsubscribe' },
        include: {
            subscription: true
        }
    });
    console.log(JSON.stringify(prefs, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
