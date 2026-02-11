import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prunebox - Privacy-First Email Subscription Management",
  description: "Take back control of your inbox. Unsubscribe from unwanted emails, rollup subscriptions into digests, and bulk delete old emails. Your data stays private - we never sell it.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
  keywords: ["email", "subscriptions", "unsubscribe", "gmail", "inbox", "privacy", "email management"],
  authors: [{ name: "Prunebox" }],
  creator: "Prunebox",
  publisher: "Prunebox",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://prunebox.com",
    title: "Prunebox - Privacy-First Email Subscription Management",
    description: "Take back control of your inbox. Unsubscribe from unwanted emails, rollup subscriptions into digests, and bulk delete old emails.",
    siteName: "Prunebox",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Prunebox Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prunebox - Privacy-First Email Subscription Management",
    description: "Take back control of your inbox. Unsubscribe from unwanted emails, rollup subscriptions into digests, and bulk delete old emails.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
