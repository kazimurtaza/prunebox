'use client';

import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

interface TrackedButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
  eventCategory: string;
  eventLabel: string;
  children: ReactNode;
}

export function TrackedButton({ href, eventCategory, eventLabel, children, ...props }: TrackedButtonProps) {
  const handleClick = () => {
    trackEvent('click', eventCategory, eventLabel);
  };

  return (
    <Link href={href} onClick={handleClick}>
      <Button {...props}>{children}</Button>
    </Link>
  );
}

interface TrackedLinkProps {
  href: string;
  eventCategory: string;
  eventLabel: string;
  children: ReactNode;
  className?: string;
}

export function TrackedLink({ href, eventCategory, eventLabel, children, className }: TrackedLinkProps) {
  const handleClick = () => {
    trackEvent('click', eventCategory, eventLabel);
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
