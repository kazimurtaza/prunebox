
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'hi@tabuu.com.au';
    const sub = await prisma.subscription.findFirst({
        where: { senderEmail: email }
    });

    if (sub) {
        console.log(`Found subscription for ${email}. Deleting it now...`);
        await prisma.subscription.delete({
            where: { id: sub.id }
        });
        console.log('Done.');
    } else {
        console.log(`No subscription found for ${email}.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
