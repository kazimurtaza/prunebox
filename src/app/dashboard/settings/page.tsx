"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Bell, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';

type Tab = 'account' | 'notifications' | 'privacy';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('account');

    const tabs = [
        { id: 'account' as Tab, label: 'Account', icon: User },
        { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
        { id: 'privacy' as Tab, label: 'Privacy', icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account preferences and privacy settings
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <aside className="md:col-span-1 space-y-1">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => {
                                setActiveTab(tab.id);
                                trackEvent('settings', 'tab_viewed', tab.id);
                            }}
                            className={`w-full justify-start font-medium ${
                                activeTab === tab.id
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <tab.icon className="mr-2 h-4 w-4" />
                            {tab.label}
                        </Button>
                    ))}
                </aside>

                <div className="md:col-span-3 space-y-6">
                    {activeTab === 'account' && (
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
                                            <Input
                                                id="name"
                                                value={session?.user?.name || ''}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                value={session?.user?.email || ''}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-destructive">Gmail Access</CardTitle>
                                    <CardDescription>
                                        Connected Gmail account permissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-sm text-destructive-foreground">
                                        Prunebox has &quot;Restricted&quot; access to your Gmail. This access is only used to manage your email groups as per our privacy policy.
                                    </div>
                                    <Button variant="outline" className="w-full">Revoke Gmail Access</Button>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {activeTab === 'notifications' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Manage how you receive updates from Prunebox
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Notification preferences are coming soon. We&apos;re working on bringing you updates about your email groups.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'privacy' && (
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
                                                We only scan headers to identify email groups. No email content is stored.
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => trackEvent('settings', 'data_exported')}>
                                            Export Data
                                        </Button>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-destructive">Delete Account</div>
                                            <div className="text-sm text-muted-foreground">
                                                Permanently delete your account and all associated data.
                                            </div>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => trackEvent('settings', 'account_deleted')}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Everything
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
