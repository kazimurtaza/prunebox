export type SubscriptionAction = 'keep' | 'unsubscribe' | 'rollup';

export interface Subscription {
  id: string;
  senderEmail: string;
  senderName: string | null;
  messageCount: number;
  recentSubject: string | null;
  lastSeenAt: string;
  confidenceScore: number;
  listUnsubscribeHeader?: string | null;
  action?: 'keep' | 'unsubscribe' | 'rollup';
}
