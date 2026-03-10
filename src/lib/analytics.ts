// GA Measurement ID
declare global {
  interface Window {
    gtag: (command: string, targetId: string | Date, config?: Record<string, unknown>) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Initialize gtag
export function initGA() {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track errors
export function trackError(error: string, context?: string) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', 'exception', {
      description: `${context ? `${context}: ` : ''}${error}`,
      fatal: false,
    });
  }
}
