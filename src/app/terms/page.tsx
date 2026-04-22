import { FileText, Mail, CreditCard, AlertTriangle, Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Prunebox</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Card className="border-2 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing or using Prunebox, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                </p>
                <p>
                  If you do not agree with any of these terms, you are prohibited from using the service.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" />
                Service Description
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Prunebox is a privacy-first email management service that provides:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email group identification and management</li>
                  <li>Bulk deletion of emails from specific senders</li>
                  <li>Unsubscription assistance for mailing lists</li>
                  <li>Email analytics and reporting</li>
                </ul>
                <p className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <strong>Important:</strong> We reserve the right to modify or discontinue the service at any time without prior notice.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">User Responsibilities</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  As a user of Prunebox, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not use the service for any illegal or unauthorized purpose</li>
                  <li>Not attempt to gain unauthorized access to our systems</li>
                </ul>
                <p className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
                  <strong>Violation:</strong> We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Payment Terms
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Prunebox offers both free and paid subscription tiers:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Free tier:</strong> Basic features with usage limits</li>
                  <li><strong>Paid tier:</strong> Enhanced features with higher limits</li>
                </ul>
                <p>
                  Paid subscriptions are billed on a recurring basis. You authorize us to charge your payment method for the selected plan.
                </p>
                <p>
                  All fees are non-refundable except as required by law.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Cancellation Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You may cancel your subscription at any time:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Go to <strong>Settings → Billing → Cancel Subscription</strong></li>
                  <li>Access continues until the end of the current billing period</li>
                  <li>No partial refunds for unused time</li>
                </ul>
                <p>
                  You may also delete your account at any time, which permanently removes all your data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Liability Limitations
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Prunebox is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Any loss of data or email messages</li>
                  <li>Direct, indirect, incidental, or consequential damages</li>
                  <li>Service interruptions or downtime</li>
                  <li>Third-party actions or service disruptions</li>
                </ul>
                <p className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <strong>Email Deletion:</strong> Use bulk deletion carefully. Deleted emails cannot be recovered.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                Governing Law
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  These terms shall be governed by and construed in accordance with applicable laws.
                </p>
                <p>
                  Any disputes arising from these terms shall be resolved through binding arbitration.
                </p>
                <p>
                  For EU users, these terms comply with GDPR and other applicable consumer protection laws.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to modify these terms at any time.
                </p>
                <p>
                  Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
                <p>
                  Material changes will be notified via email or in-app notification.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions about these Terms of Service, please contact us.
                </p>
                <p>
                  For legal inquiries, we will respond within a reasonable time.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-16">
            <Link href="/auth/signin">
              <Button size="lg">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Prunebox. Privacy-first email cleanup and grouping tool.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
