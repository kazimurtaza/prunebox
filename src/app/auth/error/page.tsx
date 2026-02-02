
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl">Authentication Error</CardTitle>
                    <CardDescription>
                        Something went wrong while trying to sign you in.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md text-sm font-mono">
                        Error: {error || 'Unknown error'}
                    </div>
                    <Button asChild className="w-full">
                        <a href="/auth/signin">Try Again</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
