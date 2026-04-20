
import { auth } from '@/modules/auth/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, Calendar } from 'lucide-react';
import { ConfigureRollupDialog } from '@/components/dashboard/configure-rollup-dialog';

async function getRollupData(userId: string) {
    const settings = await db.rollupSettings.findUnique({
        where: { userId },
    });

    const rolledUpSubscriptions = await db.subscription.findMany({
        where: {
            userId,
            preferences: {
                some: {
                    action: 'rollup',
                },
            },
        },
    });

    return { settings, subscriptions: rolledUpSubscriptions };
}

export default async function RollupPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const { settings, subscriptions } = await getRollupData(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Email Rollup</h1>
                    <p className="text-muted-foreground">
                        Daily digest of your selected email groups
                    </p>
                </div>
                <ConfigureRollupDialog
                    initialSettings={settings ? {
                        enabled: settings.enabled,
                        deliveryTime: settings.deliveryTime,
                        timezone: settings.timezone,
                        digestName: settings.digestName,
                    } : undefined}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Email Groups in Rollup</CardTitle>
                        <CardDescription>
                            {subscriptions.length} email groups will be consolidated into your next digest
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {subscriptions.length > 0 ? (
                            <div className="space-y-4">
                                {subscriptions.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {sub.senderName?.[0] || sub.senderEmail[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{sub.senderName || sub.senderEmail}</div>
                                                <div className="text-sm text-muted-foreground">{sub.senderEmail}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No email groups in rollup</h3>
                                <p className="text-muted-foreground mb-4">
                                    Go back to your dashboard and select &quot;Rollup&quot; for the email groups you want to consolidate.
                                </p>
                                <Button asChild variant="outline">
                                    <a href="/dashboard">Go to Dashboard</a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Next Delivery</div>
                                    <div className="text-2xl font-bold">{settings?.deliveryTime || '08:00'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Frequency</div>
                                    <div className="text-lg">Daily</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full">
                                Send Test Digest
                            </Button>
                            <Button
                                className="w-full"
                                variant="destructive"
                                disabled={!settings?.enabled}
                            >
                                Disable Rollup
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
