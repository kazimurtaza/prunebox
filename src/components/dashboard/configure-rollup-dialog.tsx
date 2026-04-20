"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Loader2 } from "lucide-react";

interface RollupSettings {
  enabled: boolean;
  deliveryTime: string;
  timezone: string;
  digestName: string;
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
];

interface ConfigureRollupDialogProps {
  initialSettings?: RollupSettings;
  onSaved?: () => void;
}

export function ConfigureRollupDialog({ initialSettings, onSaved }: ConfigureRollupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [settings, setSettings] = useState<RollupSettings>(
    initialSettings || {
      enabled: false,
      deliveryTime: "08:00",
      timezone: "UTC",
      digestName: "My Daily Rollup",
    }
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSettings && open) {
      fetchSettings();
    }
  }, [open, initialSettings]);

  async function fetchSettings() {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/rollup/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setFetching(false);
    }
  }

  async function saveSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rollup/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save settings");
      }
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="mr-2 h-4 w-4" />
          Configure Digest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Digest</DialogTitle>
          <DialogDescription>
            Customize your daily email rollup delivery settings.
          </DialogDescription>
        </DialogHeader>
        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enable Rollup</Label>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="digestName">Digest Name</Label>
              <Input
                id="digestName"
                value={settings.digestName}
                onChange={(e) =>
                  setSettings({ ...settings, digestName: e.target.value })
                }
                placeholder="My Daily Rollup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time</Label>
              <Input
                id="deliveryTime"
                type="time"
                value={settings.deliveryTime}
                onChange={(e) =>
                  setSettings({ ...settings, deliveryTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings({ ...settings, timezone: value })
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={loading || fetching}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
