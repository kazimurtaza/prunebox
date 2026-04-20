import { Shield, Mail, Lock, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPage() {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              Your privacy is our priority. Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Card className="border-2 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Google API Limited Use Disclosure</h2>
              <p className="text-muted-foreground bg-primary/5 p-4 rounded-md border border-primary/20">
                The use of information received from Gmail APIs will adhere to Google&apos;s User Data Policy, including the Limited Use requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                Data We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We only collect the minimum data necessary to provide our email group management service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Email headers:</strong> Subject, sender, date, and List-Unsubscribe headers</li>
                  <li><strong>Sender patterns:</strong> Email addresses and domains to identify email groups</li>
                  <li><strong>Account information:</strong> Your name and email address from Google OAuth</li>
                </ul>
                <p className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
                  <strong>We do NOT store:</strong> Email body content, attachments, or message content. We only scan headers to identify subscriptions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                How We Use Your Data
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your data is used <strong>only</strong> to provide the email group management service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Scan your inbox to identify email subscriptions and groups</li>
                  <li>Display email groups in your dashboard</li>
                  <li>Execute bulk deletion or unsubscription requests you initiate</li>
                  <li>Send optional digest emails about your email groups</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Google Limited Use Compliance</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Prunebox complies with Google&apos;s Limited Use requirements for Gmail API data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>No data selling:</strong> We never sell, rent, or share your data with third parties</li>
                  <li><strong>No advertising:</strong> We do not use your data for advertising purposes</li>
                  <li><strong>No AI training:</strong> We do not use your data to train non-personalized AI/ML models</li>
                  <li><strong>User control:</strong> You can export or delete all your data at any time from Settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-destructive" />
                Data Deletion
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You have the right to delete all your data at any time:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Go to <strong>Settings → Privacy → Delete Account</strong></li>
                  <li>This permanently removes all your data from our servers</li>
                  <li>Gmail access is also revoked via Google OAuth</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Data Storage & Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Storage location:</strong> Data is stored in secure PostgreSQL databases</li>
                  <li><strong>Encryption:</strong> All data is encrypted at rest and in transit</li>
                  <li><strong>Retention:</strong> Data is retained until you delete your account</li>
                  <li><strong>Access:</strong> Only you can access your data via authenticated sessions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Third Parties</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell, rent, or share your data with third parties. The only third-party services we use are:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Google OAuth:</strong> For authentication and Gmail API access</li>
                  <li><strong>Vercel/PostgreSQL:</strong> For hosting and database infrastructure</li>
                </ul>
                <p className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <strong>Important:</strong> We do not use any analytics, tracking, or advertising services.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">GDPR Rights (EU Users)</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you are located in the EU, you have the following rights under GDPR:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Right to access:</strong> Request a copy of your data</li>
                  <li><strong>Right to rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Right to erasure:</strong> Delete all your data</li>
                  <li><strong>Right to data portability:</strong> Export your data</li>
                  <li><strong>Right to object:</strong> Object to data processing</li>
                </ul>
                <p>
                  To exercise these rights, please contact us or use the Delete Account feature in Settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions about this privacy policy or how we handle your data, please contact us.
                </p>
                <p>
                  For GDPR inquiries, we will respond within 30 days as required by law.
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
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
