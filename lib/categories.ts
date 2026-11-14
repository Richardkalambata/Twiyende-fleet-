export const PASSENGER_CATEGORIES = ['phone', 'bag', 'wallet', 'id', 'keys', 'other'] as const;

export const CONDUCTOR_CATEGORIES = ['phone', 'bag', 'wallet', 'id', 'umbrella', 'other'] as const;

const LABELS: Record<string, string> = {
  phone: 'Phone',
  bag: 'Bag',
  wallet: 'Wallet',
  id: 'ID',
  keys: 'Keys',
  umbrella: 'Umbrella',
  other: 'Other',
};

export function categoryLabel(id: string): string {
  return LABELS[id] ?? 'Item';
}

export function isCategory(id: string): boolean {
  return id in LABELS;
}
