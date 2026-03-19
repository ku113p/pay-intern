export const CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'creative', label: 'Creative' },
  { value: 'business', label: 'Business' },
  { value: 'trades', label: 'Trades' },
  { value: 'other', label: 'Other' },
] as const;

const VALID_VALUES = new Set(CATEGORIES.map((c) => c.value as string));

export function sanitizeCategory(value: string): string {
  return VALID_VALUES.has(value) ? value : '';
}
