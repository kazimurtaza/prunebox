
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://github.com/shadcn.png',
        },
    });

    const subscriptions = [
        {
            senderEmail: 'newsletter@techcrunch.com',
            senderName: 'TechCrunch',
            unsubscribeMethod: 'http',
            unsubscribeUrl: 'https://techcrunch.com/unsubscribe',
            confidenceScore: 100,
            recentSubject: 'Daily Tech News',
            recentSnippet: 'Here is your daily dose of technology news...',
        },
        {
            senderEmail: 'updates@github.com',
            senderName: 'GitHub',
            unsubscribeMethod: 'manual',
            confidenceScore: 90,
            recentSubject: '[GitHub] Summary of activity',
            recentSnippet: 'You have 5 new notifications in your inbox...',
        },
        {
            senderEmail: 'marketing@uber.com',
            senderName: 'Uber',
            unsubscribeMethod: 'one_click',
            unsubscribeUrl: 'https://uber.com/unsub',
            confidenceScore: 100,
            recentSubject: 'Save 20% on your next ride',
            recentSnippet: 'Limited time offer! Use code SAVE20...',
        },
        {
            senderEmail: 'promotions@nike.com',
            senderName: 'Nike',
            unsubscribeMethod: 'mailto',
            unsubscribeMailto: 'mailto:unsub@nike.com?subject=unsubscribe',
            confidenceScore: 95,
            recentSubject: 'The New Collection is Here',
            recentSnippet: 'Shop our latest styles and exclusive releases...',
        },
    ];

    for (const sub of subscriptions) {
        await prisma.subscription.upsert({
            where: {
                userId_senderEmail: {
                    userId: user.id,
                    senderEmail: sub.senderEmail,
                },
            },
            update: {},
            create: {
                ...sub,
                userId: user.id,
            },
        });
    }

    // Create some preferences
    const allSubs = await prisma.subscription.findMany({ where: { userId: user.id } });

    await prisma.subscriptionPreference.upsert({
        where: {
            userId_subscriptionId: {
                userId: user.id,
                subscriptionId: allSubs[0].id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            subscriptionId: allSubs[0].id,
            action: 'keep',
        },
    });

    await prisma.subscriptionPreference.upsert({
        where: {
            userId_subscriptionId: {
                userId: user.id,
                subscriptionId: allSubs[1].id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            subscriptionId: allSubs[1].id,
            action: 'rollup',
        },
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
