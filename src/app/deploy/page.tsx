import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Docker, Server, Shield, Zap } from "lucide-react";

export default function DeployPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Self-Host Prunebox</h1>
          <p className="text-xl text-muted-foreground">
            Deploy your own privacy-first email cleanup tool
          </p>
        </div>

        {/* Docker Compose - Recommended */}
        <Card className="mb-8 border-2 border-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Docker className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Option 1: Docker Compose (Recommended)</CardTitle>
                <CardDescription>Fastest way to get running</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Clone: <code className="bg-muted px-2 py-1 rounded">git clone https://github.com/kazimurtaza/prunebox.git</code></li>
              <li>Copy env file: <code className="bg-muted px-2 py-1 rounded">cp .env.example .env</code></li>
              <li>Edit <code className="bg-muted px-2 py-1 rounded">.env</code> with your values (see below)</li>
              <li>Run: <code className="bg-muted px-2 py-1 rounded">docker-compose up -d</code></li>
            </ol>
          </CardContent>
        </Card>

        {/* Pre-built Image */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Option 2: Pre-built Docker Image</CardTitle>
                <CardDescription>Pull from GitHub Container Registry</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">
                docker pull ghcr.io/kazimurtaza/prunebox:latest
              </code>
            </div>
            <p className="text-sm text-muted-foreground">
              Available tags: <code>:latest</code>, <code>:develop</code>, <code>:vX.Y.Z</code>
            </p>
          </CardContent>
        </Card>

        {/* Build from Source */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Option 3: Build from Source</CardTitle>
                <CardDescription>For development or customization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <code className="text-sm block">npm install</code>
              <code className="text-sm block">npm run build:worker</code>
              <code className="text-sm block">npm run build:next</code>
              <code className="text-sm block">npm start</code>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Configuration</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Required Environment Variables</CardTitle>
              <CardDescription>Add these to your <code>.env</code> file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">DATABASE_URL</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      postgresql://prunebox:password@localhost:5432/prunebox
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">REDIS_URL</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      redis://localhost:6379
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">NEXTAUTH_URL</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      https://yourdomain.com
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">NEXTAUTH_SECRET</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      openssl rand -base64 32
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">ENCRYPTION_KEY</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      openssl rand -base64 48
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">GMAIL_WEBHOOK_SECRET</label>
                    <code className="block bg-muted p-2 rounded text-xs">
                      openssl rand -base64 64
                    </code>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Google OAuth Setup</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Go to Google Cloud Console</li>
                    <li>Enable Gmail API</li>
                    <li>Create OAuth 2.0 credentials (Web application)</li>
                    <li>Add redirect: <code>https://yourdomain.com/api/auth/callback</code></li>
                    <li>Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code></li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gmail Scopes Warning */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Shield className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Gmail API Scopes Required</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    This app uses restricted scopes that require Google verification for production use.
                    Without verification, you&apos;re limited to 100 test users.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <code>gmail.readonly</code> - Read email headers</li>
                    <li>• <code>gmail.modify</code> - Move emails, trash, apply labels</li>
                    <li>• <code>gmail.labels</code> - Create/manage labels</li>
                    <li>• <code>gmail.send</code> - Send digest emails</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Tech Stack</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Frontend</h4>
                <p className="text-sm text-muted-foreground">Next.js 15, React 19, TypeScript</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Server className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Backend</h4>
                <p className="text-sm text-muted-foreground">Next.js API, PostgreSQL, Redis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Docker className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Deployment</h4>
                <p className="text-sm text-muted-foreground">Docker, BullMQ, Prisma</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* GitHub Link */}
        <div className="mt-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">Star on GitHub</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get the source code, report issues, or contribute
              </p>
              <Link href="https://github.com/kazimurtaza/prunebox" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  github.com/kazimurtaza/prunebox
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Prunebox. Privacy-first email cleanup and grouping tool.</p>
        </div>
      </footer>
    </div>
  );
}
