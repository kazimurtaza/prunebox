'use client';

import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface TrackedActionButtonProps {
  eventLabel: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function TrackedActionButton({
  eventLabel,
  children,
  onClick,
  disabled,
  variant = 'outline',
  className,
}: TrackedActionButtonProps) {
  const handleClick = () => {
    trackEvent('rollup', eventLabel);
    onClick?.();
  };

  return (
    <Button variant={variant} onClick={handleClick} disabled={disabled} className={className}>
      {children}
    </Button>
  );
}
