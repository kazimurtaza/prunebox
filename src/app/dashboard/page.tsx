'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { ScanButton } from '@/components/dashboard/scan-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { clientError } from '@/lib/client-logger';
import type { Subscription } from '@/components/subscriptions/subscription-list';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const subsResponse = await fetch('/api/subscriptions');

      if (subsResponse.ok) {
        const data = await subsResponse.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      clientError('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription updates from child components
  const handleSubscriptionsUpdate = (newSubscriptions: Subscription[]) => {
    setSubscriptions(newSubscriptions);
  };

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  // Calculate metrics
  const totalSenders = subscriptions.length;
  const totalEmails = subscriptions.reduce((sum, s) => sum + s.messageCount, 0);
  const highConfidenceSubscriptions = subscriptions.filter((s) => s.confidenceScore >= 70).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Emails</h1>
          <p className="text-muted-foreground text-sm">
            {totalSenders} senders found • {totalEmails} emails scanned
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScanButton initialStatus="idle" onScanComplete={fetchData} />
          <ThemeToggle />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Senders</CardDescription>
            <CardTitle className="text-3xl">{totalSenders}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Emails Scanned</CardDescription>
            <CardTitle className="text-3xl text-primary">{totalEmails}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Likely Mailing Lists</CardDescription>
            <CardTitle className="text-3xl text-primary">{highConfidenceSubscriptions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Email Groups List */}
      <Card>
        <CardContent className="pt-6">
          <SubscriptionList
            userId={session.user.id}
            initialSubscriptions={subscriptions}
            onUpdate={handleSubscriptionsUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Emails</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-3"><CardDescription>Total Senders</CardDescription><CardTitle className="text-3xl">...</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Emails Scanned</CardDescription><CardTitle className="text-3xl text-primary">...</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Likely Mailing Lists</CardDescription><CardTitle className="text-3xl text-primary">...</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardContent className="pt-6 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading email groups...</p>
            <div className="h-[600px] w-full bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
