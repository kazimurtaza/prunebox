import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, Mail, Trash2 } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Prunebox</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/how-it-works">
              <Button variant="ghost">How It Works</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Take control of your inbox without breaking the bank
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Try before you commit</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>10 free unsubscribes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>View all subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Scan up to 1,000 emails</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Privacy-first, always</span>
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Annual - Most Popular */}
          <Card className="border-2 border-green-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle>Annual</CardTitle>
              <CardDescription>Best value for regular users</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$24.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited unsubscribes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited email scans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Rollup digests (up to 10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Bulk delete emails</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Priority email support</span>
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Lifetime */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Lifetime</CardTitle>
              <CardDescription>Pay once, use forever</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$59</span>
                <span className="text-muted-foreground">/once</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Everything in Annual</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Lifetime access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>No recurring fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Early adopter bonus</span>
                </li>
              </ul>
              <Link href="/auth/signin">
                <Button className="w-full" variant="outline">Get Lifetime</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Comparison */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How We Compare</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">Feature</th>
                  <th className="px-6 py-3 text-center">Prunebox</th>
                  <th className="px-6 py-3 text-center">Clean Email</th>
                  <th className="px-6 py-3 text-center">Unroll.me</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4">True Unsubscribe</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-red-500">✗</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Bulk Delete</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-red-500">✗</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">No Data Selling</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-red-500">✗</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Starting Price</td>
                  <td className="px-6 py-4 text-center font-bold">$24.99/yr</td>
                  <td className="px-6 py-4 text-center">$29.99/yr</td>
                  <td className="px-6 py-4 text-center">Free (with data)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Privacy Guarantee */}
        <div className="mt-16 max-w-2xl mx-auto bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Privacy Guarantee</h3>
          <p className="text-green-800 dark:text-green-200">
            We never sell your data. Your email content is used only to manage your subscriptions.
            You can delete all your data at any time. No ads, no tracking, no exceptions.
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
