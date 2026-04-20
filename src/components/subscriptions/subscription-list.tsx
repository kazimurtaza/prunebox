"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { clientError } from "@/lib/client-logger";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Mail, Trash, AlertTriangle, ArrowUpDown, Search, ChevronDown, ChevronUp, GripHorizontal, MoreVertical, MailX, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Subscription {
  id: string;
  senderEmail: string;
  senderName: string;
  messageCount: number;
  recentSubject: string;
  lastSeenAt: string;
  confidenceScore: number;
  listUnsubscribeHeader?: string | null;
  action?: "keep" | "unsubscribe" | "rollup";
}

interface SubscriptionListProps {
  userId: string;
  initialSubscriptions?: Subscription[];
  onUpdate?: (subscriptions: Subscription[]) => void;
}

type SortOption =
  | "recent-desc"
  | "recent-asc"
  | "emails-desc"
  | "emails-asc"
  | "name-asc"
  | "name-desc"
  | "confidence-desc"
  | "confidence-asc";

type FilterOption = "all" | "unsubscribe" | "high-confidence" | "low-confidence" | "has-unsubscribe";

export function SubscriptionList({ userId: _userId, initialSubscriptions, onUpdate }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions || []);
  const [loading, setLoading] = useState(!initialSubscriptions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("emails-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingSenderEmails, setProcessingSenderEmails] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [emailSubjects, setEmailSubjects] = useState<Map<string, string[]>>(new Map());
  const [loadingSubjects, setLoadingSubjects] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    senderEmails: string[];
    subscriptionIds?: string[];
    count: number;
    totalEmails: number;
  }>({ open: false, senderEmails: [], count: 0, totalEmails: 0 });

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Mobile filters toggle state
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Resizable height state
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(() => {
    // Load saved height from localStorage, default to calculated height
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subscription-list-height');
      if (saved) return parseInt(saved, 10);
    }
    return 800; // fallback default
  });
  const [isResizing, setIsResizing] = useState(false);

  // Minimum height constraint
  const MIN_HEIGHT = 400;

  // Calculate default height based on viewport
  const calculateDefaultHeight = () => {
    if (typeof window === 'undefined') return 800;

    // Approximate heights of elements above the list
    const headerSectionHeight = 80;    // Header with title and scan button
    const statsCardsHeight = 140;       // Stats cards section
    const filtersHeight = 180;          // Search, filters, sort, bulk actions
    const padding = 80;                 // Page padding and margins

    // Calculate available height
    const availableHeight = window.innerHeight - headerSectionHeight - statsCardsHeight - filtersHeight - padding;

    return Math.max(MIN_HEIGHT, Math.min(availableHeight, 1200)); // Max 1200px
  };

  // Initialize height on mount (if not saved)
  useEffect(() => {
    const savedHeight = localStorage.getItem('subscription-list-height');
    if (!savedHeight) {
      const defaultHeight = calculateDefaultHeight();
      setListHeight(defaultHeight);
    }
  }, []);

  // Recalculate on window resize (only if user hasn't manually resized)
  useEffect(() => {
    const handleResize = () => {
      const savedHeight = localStorage.getItem('subscription-list-height');
      if (!savedHeight) {
        const defaultHeight = calculateDefaultHeight();
        setListHeight(defaultHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save height to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('subscription-list-height', listHeight.toString());
    }
  }, [listHeight]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startHeight = listHeight;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = currentY - startY;
      const newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY);
      setListHeight(newHeight);
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  // FIXED: Watch initialSubscriptions for changes (fixes post-scan empty page)
  useEffect(() => {
    setSubscriptions(initialSubscriptions || []);
    onUpdate?.(initialSubscriptions || []);
    setLoading(false);
    // Reset pagination when initialSubscriptions change (e.g., after scan)
    setHasMore(false);
    setNextCursor(null);
  }, [initialSubscriptions, onUpdate]);

  const fetchSubscriptions = async (cursor?: string | null) => {
    try {
      setLoading(cursor === undefined); // Only show full loading on initial fetch
      if (cursor) setLoadingMore(true);

      let url = "/api/subscriptions";
      if (cursor) url += `?cursor=${encodeURIComponent(cursor)}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (cursor) {
          // Append to existing subscriptions
          setSubscriptions(prev => [...prev, ...data.subscriptions]);
        } else {
          setSubscriptions(data.subscriptions);
          onUpdate?.(data.subscriptions);
        }
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      clientError("Failed to fetch subscriptions", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
        setSubscriptions((prev) => {
          const updated = prev.map((s) => (s.id === subscriptionId ? { ...s, action } : s));
          onUpdate?.(updated);
          return updated;
        });
      }
    } catch (error) {
      clientError("Failed to update action", error);
    }
  };

  const toggleCardExpansion = async (subscriptionId: string, senderEmail: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(subscriptionId)) {
      newExpanded.delete(subscriptionId);
    } else {
      newExpanded.add(subscriptionId);
      // Fetch email subjects if not already loaded
      if (!emailSubjects.has(senderEmail) && !loadingSubjects.has(senderEmail)) {
        setLoadingSubjects((prev) => new Set([...prev, senderEmail]));
        try {
          const response = await fetch(`/api/subscriptions/subjects?senderEmail=${encodeURIComponent(senderEmail)}`);
          if (response.ok) {
            const data = await response.json();
            setEmailSubjects((prev) => new Map(prev).set(senderEmail, data.subjects));
          } else {
            const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            clientError("Failed to fetch email subjects", new Error(error.error?.message || 'API error'), { senderEmail });
            setEmailSubjects((prev) => new Map(prev).set(senderEmail, [])); // Set empty array to show error state
          }
        } catch (error) {
          clientError("Failed to fetch email subjects", error, { senderEmail });
          setEmailSubjects((prev) => new Map(prev).set(senderEmail, [])); // Set empty array to show error state
        } finally {
          setLoadingSubjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(senderEmail);
            return newSet;
          });
        }
      }
    }
    setExpandedCards(newExpanded);
  };

  const bulkAction = async (action: "unsubscribe" | "delete") => {
    if (selectedIds.size === 0) return;

    if (action === "delete") {
      const selectedSubs = subscriptions.filter((s) => selectedIds.has(s.id));
      setDeleteConfirm({
        open: true,
        senderEmails: selectedSubs.map((s) => s.senderEmail),
        subscriptionIds: Array.from(selectedIds),
        count: selectedSubs.length,
        totalEmails: selectedSubs.reduce((sum, s) => sum + s.messageCount, 0),
      });
      return;
    }

    try {
      const response = await fetch("/api/subscriptions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionIds: Array.from(selectedIds), action }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        await fetchSubscriptions();
      }
    } catch (error) {
      clientError("Failed to perform bulk action", error, { action, selectedCount: selectedIds.size });
    }
  };

  const deleteFromSender = async (senderEmail: string, _senderName: string) => {
    const sub = subscriptions.find((s) => s.senderEmail === senderEmail);
    setDeleteConfirm({
      open: true,
      senderEmails: [senderEmail],
      count: 1,
      totalEmails: sub?.messageCount ?? 0,
    });
  };

  const handleUnsubscribe = async (subscription: Subscription) => {
    await updateAction(subscription.id, "unsubscribe");
  };

  const confirmDelete = async () => {
    // Mark senders as processing
    setProcessingSenderEmails(new Set(deleteConfirm.senderEmails));

    try {
      const response = await fetch("/api/subscriptions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          senderEmails: deleteConfirm.senderEmails,
          subscriptionIds: deleteConfirm.subscriptionIds,
        }),
      });

      if (response.ok) {
        // Close dialog and clear selection
        setDeleteConfirm({ open: false, senderEmails: [], count: 0, totalEmails: 0 });
        setSelectedIds(new Set());

        // Rescan each affected sender to update counts or remove if deleted
        for (const senderEmail of deleteConfirm.senderEmails) {
          try {
            const scanResponse = await fetch("/api/subscriptions/scan-sender", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ senderEmail }),
            });
            if (!scanResponse.ok) {
              clientError(`Failed to rescan sender`, undefined, { senderEmail, status: scanResponse.statusText });
            }
          } catch (error) {
            clientError(`Failed to rescan sender`, error, { senderEmail });
          }
        }

        // Refresh the subscription list
        await fetchSubscriptions();
      }
    } catch (error) {
      clientError("Failed to delete emails", error, { senderEmails: deleteConfirm.senderEmails });
    } finally {
      // Clear processing state
      setProcessingSenderEmails(new Set());
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.senderName.toLowerCase().includes(query) ||
        s.senderEmail.toLowerCase().includes(query)
      );
    }

    switch (filter) {
      case "unsubscribe":
        result = result.filter((s) => s.action === "unsubscribe");
        break;
      case "high-confidence":
        result = result.filter((s) => s.confidenceScore >= 70);
        break;
      case "low-confidence":
        result = result.filter((s) => s.confidenceScore < 50);
        break;
      case "has-unsubscribe":
        result = result.filter((s) => s.listUnsubscribeHeader);
        break;
      default:
        break;
    }

    return result;
  }, [subscriptions, filter, searchQuery]);

  // Sort subscriptions
  const sortedSubscriptions = useMemo(() => {
    const sorted = [...filteredSubscriptions];

    switch (sortBy) {
      case "recent-desc":
        sorted.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
        break;
      case "recent-asc":
        sorted.sort((a, b) => new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime());
        break;
      case "emails-desc":
        sorted.sort((a, b) => b.messageCount - a.messageCount);
        break;
      case "emails-asc":
        sorted.sort((a, b) => a.messageCount - b.messageCount);
        break;
      case "name-asc":
        sorted.sort((a, b) => (a.senderName || a.senderEmail).localeCompare(b.senderName || b.senderEmail));
        break;
      case "name-desc":
        sorted.sort((a, b) => (b.senderName || b.senderEmail).localeCompare(a.senderName || a.senderEmail));
        break;
      case "confidence-desc":
        sorted.sort((a, b) => b.confidenceScore - a.confidenceScore);
        break;
      case "confidence-asc":
        sorted.sort((a, b) => a.confidenceScore - b.confidenceScore);
        break;
    }

    return sorted;
  }, [filteredSubscriptions, sortBy]);

  // All are selected if selection size equals filtered size
  const allSelected = sortedSubscriptions.length > 0 && selectedIds.size === sortedSubscriptions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading email groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters, Sort, and Bulk Actions */}
      <div className="flex flex-col gap-4">
        {/* Search field - always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by sender name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mobile: Filter toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="sm:hidden flex items-center justify-between w-full"
        >
          <span>Filters & Sort</span>
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Filters section - collapsible on mobile */}
        <div className={cn(
          "space-y-4",
          !filtersOpen && "hidden sm:block"
        )}>
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("all");
              }}
            >
              All ({subscriptions.length})
            </Button>
            <Button
              variant={filter === "high-confidence" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("high-confidence");
              }}
            >
              High Confidence
            </Button>
            <Button
              variant={filter === "low-confidence" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("low-confidence");
              }}
            >
              Low Confidence
            </Button>
            <Button
              variant={filter === "has-unsubscribe" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("has-unsubscribe");
              }}
            >
              Has Unsubscribe
            </Button>
          </div>

          {/* Middle row: Select All + Sort + Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all email groups"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                {allSelected ? "Unselect All" : "Select All"} ({sortedSubscriptions.length})
              </label>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent-desc">Most Recent</SelectItem>
                  <SelectItem value="recent-asc">Least Recent</SelectItem>
                  <SelectItem value="emails-desc">Most Emails</SelectItem>
                  <SelectItem value="emails-asc">Least Emails</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="confidence-desc">Highest Confidence</SelectItem>
                  <SelectItem value="confidence-asc">Lowest Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className={cn(
                "flex flex-col sm:flex-row gap-2 sm:items-center",
                "w-full sm:w-auto"
              )}>
                <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>

                {/* Desktop: Show both buttons with text */}
                <div className="hidden sm:flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete All Emails ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => bulkAction("unsubscribe")}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Unsubscribe
                  </Button>
                </div>

                {/* Mobile: Icon-only buttons with larger tap target */}
                <div className="flex sm:hidden gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => bulkAction("delete")}
                    className="h-12 px-4"
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkAction("unsubscribe")}
                    className="h-12 px-4"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="relative" ref={containerRef}>
        <div
          className="overflow-y-auto pr-2"
          style={{ height: `${listHeight}px` }}
        >
          <div className="space-y-2 p-2 pr-4">
          {sortedSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No email groups found</h3>
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "Start by scanning your inbox for email groups."
                    : `No email groups match the "${filter}" filter.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedSubscriptions.map((subscription) => (
              <Card
                key={subscription.id}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedIds.has(subscription.id) && "ring-2 ring-primary",
                  "hover:bg-accent/50"
                )}
                onClick={() => !processingSenderEmails.has(subscription.senderEmail) && toggleSelection(subscription.id)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(subscription.id)}
                      onCheckedChange={() => toggleSelection(subscription.id)}
                      disabled={processingSenderEmails.has(subscription.senderEmail)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header row with name, badges, and actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Expand chevron - visible on all screen sizes */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardExpansion(subscription.id, subscription.senderEmail);
                            }}
                            className="flex-shrink-0"
                            title={expandedCards.has(subscription.id) ? "Show less" : "Show recent emails"}
                          >
                            {expandedCards.has(subscription.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>

                          <h3 className="font-semibold truncate text-sm sm:text-base">
                            {subscription.senderName}
                          </h3>

                          {/* Mobile: more menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="sm:hidden">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                deleteFromSender(subscription.senderEmail, subscription.senderName);
                              }}>
                                <Trash className="mr-2 h-4 w-4 text-destructive" />
                                Delete All Emails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateAction(subscription.id, "rollup");
                              }}>
                                <Layers className="mr-2 h-4 w-4" />
                                Rollup
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleUnsubscribe(subscription);
                              }}>
                                <MailX className="mr-2 h-4 w-4" />
                                Unsubscribe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Desktop: action buttons */}
                        <div className="hidden sm:flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteFromSender(subscription.senderEmail, subscription.senderName)}
                            disabled={processingSenderEmails.has(subscription.senderEmail)}
                            className="h-8 px-3"
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant={subscription.action === "rollup" ? "secondary" : "outline"}
                            onClick={() => updateAction(subscription.id, "rollup")}
                            disabled={processingSenderEmails.has(subscription.senderEmail)}
                            className="h-8 px-3"
                          >
                            <Layers className="h-4 w-4 mr-1" />
                            Rollup
                          </Button>
                          <Button
                            size="sm"
                            variant={subscription.action === "unsubscribe" ? "secondary" : "outline"}
                            onClick={() => updateAction(subscription.id, "unsubscribe")}
                            disabled={processingSenderEmails.has(subscription.senderEmail)}
                            className="h-8 px-3"
                          >
                            Unsubscribe
                          </Button>
                        </div>
                      </div>

                      {/* Email and badges */}
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mb-2">
                        {subscription.senderEmail}
                      </p>

                      {/* Badges - wrap on mobile */}
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Badge variant="outline" className="text-xs">
                          {subscription.messageCount > 0 ? `${subscription.messageCount} emails` : 'No emails'}
                        </Badge>
                        <Badge
                          variant={subscription.confidenceScore >= 70 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {subscription.confidenceScore}% confidence
                        </Badge>
                        {subscription.listUnsubscribeHeader && (
                          <Badge variant="outline" className="text-xs">
                            Can unsubscribe
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable content (email preview) - collapsible on mobile */}
                  {expandedCards.has(subscription.id) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {subscription.recentSubject && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Recent: &quot;{subscription.recentSubject}&quot;
                        </p>
                      )}
                      {loadingSubjects.has(subscription.senderEmail) ? (
                        <div className="flex items-center gap-2 py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">Loading email subjects...</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground mb-2">
                            Recent emails from this sender:
                          </p>
                          {emailSubjects.get(subscription.senderEmail)?.map((subject, index) => (
                            <div
                              key={index}
                              className="text-sm text-muted-foreground py-1 px-2 rounded hover:bg-accent truncate"
                            >
                              {index + 1}. {subject || "(No subject)"}
                            </div>
                          )) || (
                            <p className="text-sm text-muted-foreground">No subjects found</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading overlay when processing */}
                  {processingSenderEmails.has(subscription.senderEmail) && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm font-medium text-muted-foreground">Processing...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => fetchSubscriptions(nextCursor)}
              disabled={loadingMore}
              className="min-w-[200px]"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
        </div>

        {/* Resize Handle */}
        <div
          className={cn(
            "flex items-center justify-center cursor-row-resize select-none",
            "hover:bg-accent transition-colors",
            isResizing && 'bg-accent'
          )}
          style={{ height: '12px' }}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onDoubleClick={() => {
            // Reset to calculated default height
            const defaultHeight = calculateDefaultHeight();
            setListHeight(defaultHeight);
          }}
          title={`Drag to resize (${listHeight}px). Double-click to reset.`}
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          {isResizing && (
            <span className="ml-2 text-xs text-muted-foreground">
              {Math.round(listHeight)}px
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Move Emails to Trash?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>{deleteConfirm.totalEmails.toLocaleString()} email{deleteConfirm.totalEmails !== 1 ? 's' : ''}</strong> to Trash from {deleteConfirm.count === 1
                ? (
                  <span className="font-medium">&ldquo;{deleteConfirm.senderEmails[0]}&rdquo;</span>
                )
                : (
                  <>
                    {deleteConfirm.count} senders:
                    <span className="block mt-1 max-h-24 overflow-y-auto text-xs font-mono">
                      {deleteConfirm.senderEmails.join(', ')}
                    </span>
                  </>
                )
              }.
              <br /><br />
              Deleted emails can be recovered from Gmail&apos;s Trash for up to 30 days.
              <br /><br />
              <strong className="text-destructive">This action cannot be undone through Prunebox.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
