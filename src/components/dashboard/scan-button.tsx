
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Scan, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface ScanButtonProps {
    initialStatus?: string;
}

export function ScanButton({ initialStatus }: ScanButtonProps) {
    const [status, setStatus] = useState(initialStatus || 'idle');
    const { toast } = useToast();

    const handleScan = async (forceFullScan = false) => {
        setStatus('scanning');
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
                    description: "We're searching your inbox for subscriptions. This may take a minute.",
                });

                // Refresh page after a delay to show progress if possible
                setTimeout(() => window.location.reload(), 2000);
            } else {
                const error = await response.json();
                toast({
                    title: "Scan failed",
                    description: error.error || "Could not start scan",
                    variant: "destructive",
                });
                setStatus('idle');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
            setStatus('idle');
        }
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                onClick={() => handleScan(false)}
                disabled={status === 'scanning'}
                className="rounded-r-none"
            >
                {status === 'scanning' ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                    </>
                ) : (
                    <>
                        <Scan className="mr-2 h-4 w-4" />
                        Scan Inbox
                    </>
                )}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={status === 'scanning'}>
                    <Button variant="default" className="px-2 rounded-l-none border-l border-white/20">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleScan(false)}>
                        Fast Scan (Last 90 days)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleScan(true)}>
                        Full Scan (Whole Inbox)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
