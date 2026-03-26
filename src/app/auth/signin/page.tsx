'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail } from 'lucide-react';

function SignInContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, { title: string; description: string }> = {
        OAuthAccountNotLinked: {
          title: 'Account Not Linked',
          description: 'This email is already associated with a different account. Please sign in with the original method you used.',
        },
        OAuthCallbackError: {
          title: 'Authentication Failed',
          description: 'There was a problem signing you in. Please try again.',
        },
        AccessDenied: {
          title: 'Access Denied',
          description: 'You denied the permission to access your account. Please try again and accept the permissions.',
        },
        Configuration: {
          title: 'Configuration Error',
          description: 'There is a problem with the sign in configuration. Please contact support.',
        },
        Default: {
          title: 'Authentication Error',
          description: 'Something went wrong while trying to sign you in. Please try again.',
        },
      };

      const errorInfo = errorMessages[error] || errorMessages.Default;
      toast({
        variant: 'destructive',
        title: errorInfo.title,
        description: errorInfo.description,
      });

      // Clear the error parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
    // Only depend on searchParams, not toast function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Prunebox</h1>
          <p className="text-muted-foreground">
            Connect your Gmail to start managing subscriptions
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                await signIn('google', { callbackUrl: '/dashboard' });
              } catch (error) {
                console.error('SignIn error:', error);
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          <p className="mt-2">We never sell your data. Your email privacy is our priority.</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
