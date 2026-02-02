import { auth } from '@/modules/auth/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { Scan } from 'lucide-react';
import { ScanButton } from '@/components/dashboard/scan-button';
import { db } from '@/lib/db';

async function getSubscriptions(userId: string) {
  try {
    const subscriptions = await db.subscription.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      take: 200, // Increased limit
    });

    const preferences = await db.subscriptionPreference.findMany({
      where: { userId },
    });

    const prefMap = new Map(preferences.map((p: { subscriptionId: string; action: string }) => [p.subscriptionId, p.action]));

    return subscriptions.map((s: any) => ({
      ...s,
      action: (prefMap.get(s.id) as 'keep' | 'unsubscribe' | 'rollup') || undefined,
    }));
  } catch (error) {
    return [];
  }
}

async function getSyncState(userId: string) {
  try {
    return await db.gmailSyncState.findUnique({
      where: { userId },
    });
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const subscriptions = await getSubscriptions(session.user.id);
  const syncState = await getSyncState(session.user.id);

  const unsubscribedCount = subscriptions.filter((s: any) => s.action === 'unsubscribe').length;
  const rollupCount = subscriptions.filter((s: any) => s.action === 'rollup').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage {subscriptions.length} detected subscriptions
          </p>
        </div>

        <ScanButton initialStatus={syncState?.scanStatus} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Subscriptions</CardDescription>
            <CardTitle className="text-3xl">{subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unsubscribed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{unsubscribedCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Rollup</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{rollupCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscription List */}
      <Card>
        <CardContent className="pt-6">
          <SubscriptionList userId={session.user.id} />
        </CardContent>
      </Card>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Scan className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground mb-6">
              Scan your inbox to find newsletters and subscription emails
            </p>
            <div className="flex justify-center">
              <ScanButton initialStatus={syncState?.scanStatus} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
