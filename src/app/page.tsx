import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Trash2, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Prunebox</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm mb-6">
            <Shield className="h-4 w-4" />
            Privacy-First. No data selling. Ever.
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Take Back Control of Your Inbox
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unsubscribe from unwanted emails for real. Rollup subscriptions into daily digests.
            Bulk delete thousands of emails in seconds. Your data stays private.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg">
                <Zap className="mr-2 h-5 w-5" />
                Start Free - 10 Unsubscribes
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="text-lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">True Unsubscribe</h3>
            <p className="text-muted-foreground">
              Unlike others that just filter emails, we actually unsubscribe you from mailing lists.
              Messages stop coming back.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rollup Digests</h3>
            <p className="text-muted-foreground">
              Consolidate multiple subscriptions into a single daily digest. Choose what to keep in your inbox.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-muted-foreground">
              We never sell your data. No ads. No tracking. Your email content is used only to manage your subscriptions.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Better than Unroll.me
          </h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Unroll.me was caught selling user data to Uber. We built Prunebox to do the opposite —
            we actually unsubscribe you (not just filter), we offer mass deletion capabilities,
            and we have a strict no-data-selling policy. Your privacy is our product.
          </p>
        </div>
      </main>

      <footer className="border-t bg-white/80 dark:bg-gray-900/80 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Prunebox. Privacy-first email subscription management.</p>
        </div>
      </footer>
    </div>
  );
}
