import { auth } from '@/modules/auth/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Bell, Trash2, Mail, Clock, Eye } from 'lucide-react';
import { SettingsTabs } from '@/components/settings-tabs';

type TabValue = 'account' | 'notifications' | 'privacy';

interface SettingsPageProps {
  searchParams: { tab?: TabValue };
}

function AccountTab({ user }: { user: any }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account details synced from Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={user?.name || ''} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ''} readOnly disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Gmail Access</CardTitle>
          <CardDescription>
            Connected Gmail account permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-md border border-red-100 text-sm text-red-800">
            Prunebox has "Restricted" access to your Gmail. This access is only used to manage your subscriptions as per our privacy policy.
          </div>
          <Button variant="outline" className="w-full">Revoke Gmail Access</Button>
        </CardContent>
      </Card>
    </>
  );
}

function NotificationsTab({ user }: { user: any }) {
  const rollupSettings = user?.rollupSettings;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Rollup Notifications</CardTitle>
          <CardDescription>
            Configure how and when you receive subscription digests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Email Digest</div>
                <div className="text-sm text-muted-foreground">
                  Receive a daily digest of your rolled-up subscriptions
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {rollupSettings?.enabled ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="digest-time">Digest Time</Label>
                <p className="text-sm text-muted-foreground">
                  What time should we send your daily digest?
                </p>
              </div>
            </div>
            <Input
              id="digest-time"
              type="time"
              defaultValue={rollupSettings?.digestTime || '09:00'}
              className="w-full sm:w-auto"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Preview Mode</div>
                <div className="text-sm text-muted-foreground">
                  Preview what would be in your digest without sending emails
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how we notify you about important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">New Subscriptions Detected</div>
              <div className="text-sm text-muted-foreground">
                Get notified when new email subscriptions are found
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Summary</div>
              <div className="text-sm text-muted-foreground">
                Receive a weekly summary of your subscription activity
              </div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function PrivacyTab({ user }: { user: any }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>
            We value your privacy. You can export or delete your data at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Data Collection</div>
              <div className="text-sm text-muted-foreground">
                We only scan headers to identify subscriptions. No email content is stored.
              </div>
            </div>
            <Button variant="outline" size="sm">Export Data</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-600">Delete Account</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </div>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Everything
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            How long we keep your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subscription data</span>
              <span className="text-muted-foreground">Until account deletion</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Rollup history</span>
              <span className="text-muted-foreground">30 days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Activity logs</span>
              <span className="text-muted-foreground">90 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gmail Permissions</CardTitle>
          <CardDescription>
            Manage what Prunebox can access in your Gmail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm">
            <div className="font-medium mb-2">Current Permissions:</div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Read email headers (subject, sender, date)</li>
              <li>Identify subscription patterns</li>
              <li>Move emails to folders/labels</li>
              <li>Mass delete emails</li>
            </ul>
            <div className="mt-3 text-green-600 dark:text-green-400 font-medium">
              ✓ We never read email content
            </div>
          </div>
          <Button variant="outline" className="w-full">Manage Permissions</Button>
        </CardContent>
      </Card>
    </>
  );
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      rollupSettings: true,
    },
  });

  const activeTab = searchParams.tab || 'account';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SettingsTabs />

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'account' && <AccountTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab user={user} />}
          {activeTab === 'privacy' && <PrivacyTab user={user} />}
        </div>
      </div>
    </div>
  );
}
