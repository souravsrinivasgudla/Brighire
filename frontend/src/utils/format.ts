export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function scoreTone(score: number): string {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'text-teal-700 bg-teal-50 border-teal-200'
  if (score >= 40) return 'text-orange-700 bg-orange-50 border-orange-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

export const APPLICATION_STATUSES = [
  'applied',
  'reviewing',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const
