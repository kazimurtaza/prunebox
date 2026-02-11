"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield } from "lucide-react";

const tabs = [
  { value: "account", label: "Account", icon: User },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: Shield },
];

export function SettingsTabs() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "account";

  return (
    <aside className="md:col-span-1 space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.value;

        return (
          <Link
            key={tab.value}
            href={`/dashboard/settings?tab=${tab.value}`}
            replace
          >
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive
                  ? "font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          </Link>
        );
      })}
    </aside>
  );
}
