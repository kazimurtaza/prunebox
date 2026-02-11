import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MailOpen, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center px-4 max-w-md">
        {/* 404 Number with Mail Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <MailOpen className="h-24 w-24 text-green-500 dark:text-green-400" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
              !
            </div>
          </div>
        </div>

        {/* 404 Heading */}
        <h1 className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The page
          might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link
              href="/dashboard"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Subscriptions
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/dashboard/rollup"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Rollup
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/dashboard/settings"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
