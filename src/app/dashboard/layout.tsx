import { auth } from '@/modules/auth/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/modules/auth/auth';
import Link from 'next/link';
import { Providers } from '@/components/providers/session-provider';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              <span className="font-bold text-lg">Prunebox</span>
            </Link>
            <DashboardNav />
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {session.user.image ? (
                <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
              ) : null}
              <AvatarFallback>
                {session.user.name?.[0] || session.user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <form
              action={async () => {
                'use server';
                await signOut();
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}
