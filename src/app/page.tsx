import { Shield, Mail, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { Button, ButtonProps } from "@/components/ui/button";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface LinkButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
  children: ReactNode;
}

function LinkButton({ href, children, ...props }: LinkButtonProps) {
  return (
    <Link href={href}>
      <Button {...props}>{children}</Button>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Prunebox</span>
          </div>
          <nav className="flex items-center gap-4">
            <LinkButton href="/deploy" variant="ghost">
              Self-Host
            </LinkButton>
            <LinkButton href="/auth/signin">
              Sign In
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground px-4 py-2 rounded-full text-sm mb-6">
            <Shield className="h-4 w-4" />
            Privacy-First. No data selling. Ever.
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
            Take Back Control of Your Inbox
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Group and bulk delete emails from any sender. Smart grouping identifies subscriptions automatically.
            Plus one-click unsubscribe for mailing lists. Your data stays private.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton href="/auth/signin" size="lg" className="text-lg">
              <Zap className="mr-2 h-5 w-5" />
              Get Started Free
            </LinkButton>
            <LinkButton href="/deploy" size="lg" variant="outline" className="text-lg">
              Self-Host
            </LinkButton>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="bg-card p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bulk Deletion</h3>
            <p className="text-muted-foreground">
              Delete thousands of emails from specific senders in seconds. Clean up your inbox fast.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Grouping</h3>
            <p className="text-muted-foreground">
              Automatically groups emails by sender. See exactly who&apos;s clogging your inbox.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">True Unsubscribe</h3>
            <p className="text-muted-foreground">
              For mailing lists: actually unsubscribe you (not just filter). Messages stop coming.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-muted/30 border rounded-xl p-6">
          <h3 className="font-semibold mb-2">
            Better than Unroll.me
          </h3>
          <p className="text-sm text-muted-foreground">
            Unroll.me was caught selling user data to Uber. We built Prunebox to do the opposite —
            we prioritize bulk deletion and email grouping, with unsubscribe as a secondary option for mailing lists,
            and we have a strict no-data-selling policy. Your privacy is our product.
          </p>
        </div>
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Prunebox. Privacy-first email cleanup and grouping tool.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
