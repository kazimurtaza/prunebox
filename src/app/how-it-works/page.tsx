import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Shield, Trash2, Archive, Zap, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Mail,
    title: "Connect Your Gmail",
    description: "Sign in with Google OAuth. We only request read/modify permissions to manage your subscriptions.",
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Zap,
    title: "Scan Your Inbox",
    description: "Our algorithm scans your emails for subscriptions using List-Unsubscribe headers and sender patterns.",
    color: "text-yellow-600",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    icon: Archive,
    title: "Choose Your Action",
    description: "For each subscription, decide: Keep in inbox, Rollup to digest, or Unsubscribe entirely.",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Trash2,
    title: "Clean Up & Enjoy",
    description: "Bulk delete old emails from unsubscribed senders. Enjoy a cleaner inbox forever.",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Prunebox</span>
          </Link>
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
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Prunebox Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take back control of your inbox in 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How Detection Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How We Detect Subscriptions</h2>
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    High Confidence Signals
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• List-Unsubscribe header (RFC 2369)</li>
                    <li>• List-Id header</li>
                    <li>• Precedence: bulk/list headers</li>
                    <li>• One-Click unsubscribe (RFC 8058)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Medium Confidence Signals
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Sender patterns (noreply@, newsletter@)</li>
                    <li>• ESP domains (Mailchimp, SendGrid)</li>
                    <li>• Gmail category: promotions/updates</li>
                    <li>• Recurring email from same sender</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How Unsubscribe Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">True Unsubscription vs Filtering</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-green-700 dark:text-green-300">
                  ✓ Prunebox (True Unsubscribe)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Actually removes you from mailing lists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Emails stop arriving at source</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Uses List-Unsubscribe header when available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Sends unsubscribe emails for mailto links</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-red-700 dark:text-red-300">
                  ✗ Unroll.me (Filtering Only)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <span>Only moves emails to hidden folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <span>Subscriptions remain active</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <span>Disconnecting floods your inbox again</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <span>Sells your email data to third parties</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Your Privacy, Guaranteed</h2>
              <p className="text-muted-foreground mb-4">
                We never sell, rent, or share your data. Your email content is used only to provide the subscription management service. Full GDPR compliance with right to erasure.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ No data selling, ever</li>
                <li>✓ No ads or tracking</li>
                <li>✓ Data deletion on request</li>
                <li>✓ GDPR Article 17 compliant</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to Clean Your Inbox?</h2>
          <p className="text-muted-foreground mb-6">Start with 10 free unsubscribes. No credit card required.</p>
          <Link href="/auth/signin">
            <Button size="lg">
              <Zap className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </Link>
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
