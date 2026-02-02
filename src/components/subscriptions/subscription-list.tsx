"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Archive, Mail } from "lucide-react";

interface Subscription {
  id: string;
  senderEmail: string;
  senderName: string;
  messageCount: number;
  recentSubject: string;
  confidenceScore: number;
  action?: "keep" | "unsubscribe" | "rollup";
}

interface SubscriptionListProps {
  userId: string;
}

export function SubscriptionList({ userId }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unsubscribe" | "rollup" | "keep">("all");

  useEffect(() => {
    fetchSubscriptions();
  }, [userId]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredSubscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubscriptions.map((s) => s.id)));
    }
  };

  const updateAction = async (subscriptionId: string, action: "keep" | "unsubscribe" | "rollup") => {
    try {
      const response = await fetch("/api/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });

      if (response.ok) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === subscriptionId ? { ...s, action } : s))
        );
      }
    } catch (error) {
      console.error("Failed to update action:", error);
    }
  };

  const bulkAction = async (action: "unsubscribe" | "rollup" | "delete") => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch("/api/subscriptions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionIds: Array.from(selectedIds), action }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
    }
  };

  const filteredSubscriptions = subscriptions.filter((s) => {
    if (filter === "all") return true;
    return s.action === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({subscriptions.length})
          </Button>
          <Button
            variant={filter === "keep" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("keep")}
          >
            Keep
          </Button>
          <Button
            variant={filter === "unsubscribe" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unsubscribe")}
          >
            Unsubscribe
          </Button>
          <Button
            variant={filter === "rollup" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("rollup")}
          >
            Rollup
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="destructive" onClick={() => bulkAction("unsubscribe")}>
              <Trash2 className="h-4 w-4 mr-1" />
              Unsubscribe
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction("rollup")}>
              <Archive className="h-4 w-4 mr-1" />
              Rollup
            </Button>
          </div>
        )}
      </div>

      {/* Subscription List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {filteredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "Start by scanning your inbox for subscriptions."
                    : `No subscriptions marked as "${filter}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <Card
                key={subscription.id}
                className={selectedIds.has(subscription.id) ? "ring-2 ring-green-500" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.has(subscription.id)}
                      onCheckedChange={() => toggleSelection(subscription.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{subscription.senderName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {subscription.messageCount} emails
                        </Badge>
                        {subscription.action && (
                          <Badge
                            variant={
                              subscription.action === "unsubscribe"
                                ? "destructive"
                                : subscription.action === "rollup"
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {subscription.action}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {subscription.senderEmail}
                      </p>
                      {subscription.recentSubject && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          &quot;{subscription.recentSubject}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={subscription.action === "keep" ? "default" : "outline"}
                        onClick={() => updateAction(subscription.id, "keep")}
                      >
                        Keep
                      </Button>
                      <Button
                        size="sm"
                        variant={subscription.action === "rollup" ? "default" : "outline"}
                        onClick={() => updateAction(subscription.id, "rollup")}
                      >
                        Rollup
                      </Button>
                      <Button
                        size="sm"
                        variant={subscription.action === "unsubscribe" ? "destructive" : "outline"}
                        onClick={() => updateAction(subscription.id, "unsubscribe")}
                      >
                        Unsubscribe
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
