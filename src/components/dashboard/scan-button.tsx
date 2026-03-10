'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Scan, ChevronDown, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent, trackError } from '@/lib/analytics';

interface ScanButtonProps {
    initialStatus?: string;
    onScanComplete?: () => void;
}

export function ScanButton({ initialStatus, onScanComplete }: ScanButtonProps) {
    const [status, setStatus] = useState(initialStatus || 'idle');
    const [scanProgress, setScanProgress] = useState(0);
    const [scanTotal, setScanTotal] = useState(0);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const { toast } = useToast();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialized = useRef(false);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current !== null) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Countdown for rate limit retry
    useEffect(() => {
        if (retryAfter && retryAfter > 0) {
            const timer = setInterval(() => {
                setRetryAfter(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [retryAfter]);

    // Start polling for scan status
    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current !== null) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const response = await fetch('/api/scan/status');
                if (response.ok) {
                    const data = await response.json();
                    setScanProgress(data.scanProgress || 0);
                    setScanTotal(data.scanTotal || 0);

                    if (data.scanStatus === 'idle' || data.scanStatus === 'completed') {
                        // Scan completed
                        if (pollingIntervalRef.current !== null) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setStatus('idle');
                        trackEvent('scan', 'scan_completed', undefined, data.scanTotal || 0);
                        if (onScanComplete) {
                            onScanComplete();
                        }
                        toast({
                            title: "Scan complete",
                            description: `Finished scanning ${data.scanTotal || 0} emails.`,
                        });
                    } else if (data.scanStatus === 'error') {
                        // Scan failed - check for specific error message
                        if (pollingIntervalRef.current !== null) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setStatus('idle');
                        const errorMsg = (data as { errorMessage?: string }).errorMessage;
                        trackError(errorMsg || 'Scan failed', 'scan');
                        toast({
                            title: "Scan failed",
                            description: errorMsg || "An error occurred while scanning your inbox.",
                            variant: "destructive",
                        });
                    }
                    // If still 'scanning', continue polling
                }
            } catch {
                // Keep polling on network errors
            }
        }, 2000); // Check every 2 seconds
    }, [onScanComplete, toast]);

    // Fetch initial scan status on mount (handles browser restart scenario)
    useEffect(() => {
        if (isInitialized.current) return;

        const fetchInitialStatus = async () => {
            try {
                const response = await fetch('/api/scan/status');
                if (response.ok) {
                    const data = await response.json();
                    setScanProgress(data.scanProgress || 0);
                    setScanTotal(data.scanTotal || 0);

                    // If scan is in progress, update status and start polling
                    if (data.scanStatus === 'scanning') {
                        setStatus('scanning');
                        startPolling();
                    } else if (data.scanStatus === 'error') {
                        setStatus('idle');
                        const errorMsg = (data as { errorMessage?: string }).errorMessage;
                        if (errorMsg) {
                            toast({
                                title: "Previous scan failed",
                                description: errorMsg,
                                variant: "destructive",
                            });
                        }
                    }
                }
            } catch (error) {
                // Network error - keep idle status
                console.error('Failed to fetch initial scan status:', error);
            }
            isInitialized.current = true;
        };

        fetchInitialStatus();
    }, [startPolling, toast]);

    const handleScan = async (forceFullScan = false) => {
        setStatus('scanning');
        setScanProgress(0);
        setScanTotal(0);

        // Track scan start
        if (forceFullScan) {
            trackEvent('scan', 'complete_scan_started');
        } else {
            trackEvent('scan', 'quick_scan_started');
        }

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ forceFullScan }),
            });

            if (response.ok) {
                toast({
                    title: forceFullScan ? "Full scan started" : "Scan started",
                    description: "We're searching your inbox for email groups. This may take a minute.",
                });

                // Start polling for completion
                startPolling();
            } else {
                const error = await response.json();
                // Check for rate limit error
                if (response.status === 429 || error?.error?.code === 'TOO_MANY_REQUESTS') {
                    setRetryAfter(60);
                    trackError('Rate limit exceeded', 'scan');
                    toast({
                        title: "Rate limit exceeded",
                        description: "Too many scan requests. Please wait 60 seconds before trying again.",
                        variant: "destructive",
                    });
                } else {
                    trackError(error.error?.message || 'Scan failed', 'scan');
                    toast({
                        title: "Scan failed",
                        description: error.error?.message || "Could not start scan",
                        variant: "destructive",
                    });
                }
                setStatus('idle');
            }
        } catch {
            trackError('Unexpected error during scan', 'scan');
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
            setStatus('idle');
        }
    };

    const handleReset = async () => {
        setIsResetting(true);
        trackEvent('data', 'reset_all');

        try {
            const response = await fetch('/api/sync/reset', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setShowResetDialog(false);
                toast({
                    title: "Data reset complete",
                    description: `Cleared ${data.deletedCount} subscriptions. Your next scan will be a full scan.`,
                });
                if (onScanComplete) {
                    onScanComplete();
                }
            } else {
                const error = await response.json();
                trackError(error.error || 'Reset failed', 'data');
                toast({
                    title: "Reset failed",
                    description: error.error || "Could not reset data",
                    variant: "destructive",
                });
            }
        } catch {
            trackError('Unexpected error during reset', 'data');
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                onClick={() => handleScan(false)}
                disabled={status === 'scanning' || retryAfter !== null}
                className="rounded-r-none"
            >
                {status === 'scanning' ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {scanTotal > 0 ? `Scanning ${scanProgress}/${scanTotal}` : 'Scanning...'}
                    </>
                ) : retryAfter !== null ? (
                    <>
                        <Scan className="mr-2 h-4 w-4" />
                        Retry in {retryAfter}s
                    </>
                ) : (
                    <>
                        <Scan className="mr-2 h-4 w-4" />
                        Scan Inbox
                    </>
                )}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={status === 'scanning' || retryAfter !== null}>
                    <Button variant="default" className="px-2 rounded-l-none border-l border-white/20">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleScan(false)}>
                        Quick Scan (Last 90 days, up to 1,000 emails)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleScan(true)}>
                        Complete Scan (Entire Inbox, no limit)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowResetDialog(true)}
                        className="text-destructive focus:text-destructive"
                        disabled={status === 'scanning'}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reset & Clear All Data
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset all scan data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all your subscriptions and reset your sync state.
                            Your next scan will be a full scan of your entire inbox.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            disabled={isResetting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isResetting ? 'Resetting...' : 'Reset All Data'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
