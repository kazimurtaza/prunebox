"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Bell, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

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
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full justify-start font-medium ${
                                activeTab === tab.id
                                    ? 'text-green-600 bg-green-50'
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Email Notifications</div>
                                        <div className="text-sm text-muted-foreground">
                                            Receive email updates about your subscriptions
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Configure</Button>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Rollup Digests</div>
                                        <div className="text-sm text-muted-foreground">
                                            Choose frequency of subscription digests
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Setup</Button>
                                </div>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
