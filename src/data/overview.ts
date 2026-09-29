import type { ActivityEvent, Kpi, NeedsAttentionItem, WeeklyVolume } from './types'

export const kpis: Kpi[] = [
  { id: 'open', label: 'Open claims', value: '1,284', hint: { icon: 'trend-up', text: '+4.2% vs last period' } },
  { id: 'awaiting', label: 'Awaiting review', value: '128', hint: { icon: 'queue', text: 'In queue for a handler' } },
  { id: 'time', label: 'Avg time to decision', value: '3.4 d', hint: { icon: 'target', text: 'Target 5 d · within target' } },
  { id: 'auto', label: 'Agent auto-approved', value: '61%', hint: { icon: 'percent', text: 'of claims this period' } },
  { id: 'sla', label: 'SLA breaches', value: '7', hint: { icon: 'overdue', text: 'Overdue' }, tone: 'danger' },
]

export const weeklyVolume: WeeklyVolume[] = [
  { week: 'W34', Motor: 110, Property: 65, Health: 48, Travel: 27 },
  { week: 'W35', Motor: 118, Property: 72, Health: 55, Travel: 29 },
  { week: 'W36', Motor: 126, Property: 78, Health: 60, Travel: 35 },
  { week: 'W37', Motor: 112, Property: 90, Health: 66, Travel: 40 },
  { week: 'W38', Motor: 134, Property: 81, Health: 70, Travel: 35 },
  { week: 'W39', Motor: 141, Property: 97, Health: 74, Travel: 33 },
]

export const needsAttention: NeedsAttentionItem[] = [
  { id: 'CLM-2026-004821', policyholder: 'Michael Johnson', flag: 'Loss date outside policy period', slaDays: -1 },
  { id: 'CLM-2026-004819', policyholder: 'Montgomery-Whitfield Property Holdings LLC', flag: 'Agent failed', slaDays: 0 },
  { id: 'CLM-2026-004817', policyholder: 'Sarah Mitchell', flag: 'Above authority limit', slaDays: 1 },
  { id: 'CLM-2026-004809', policyholder: 'Olivia Bennett', flag: 'Duplicate suspected', slaDays: 2 },
  { id: 'CLM-2026-004812', policyholder: 'James Wilson', flag: 'Awaiting document', slaDays: 2 },
]

export const recentActivity: ActivityEvent[] = [
  { id: 'a1', time: '10:42', actor: { kind: 'agent' }, event: 'Extracted 14 fields from FNOL', claimId: 'CLM-2026-004812' },
  { id: 'a2', time: '10:31', actor: { kind: 'person', name: 'Emily Carter' }, event: 'Approved payout €2,140.00', claimId: 'CLM-2026-004790' },
  { id: 'a3', time: '10:12', actor: { kind: 'agent' }, event: 'Flagged “Loss date outside policy period”', claimId: 'CLM-2026-004821' },
  { id: 'a4', time: '09:58', actor: { kind: 'person', name: 'Rachel Morgan' }, event: 'Requested info: discharge letter', claimId: 'CLM-2026-004812' },
  { id: 'a5', time: '09:40', actor: { kind: 'agent' }, event: 'Auto-approved at 96% · High confidence', claimId: 'CLM-2026-004803' },
  { id: 'a6', time: '09:15', actor: { kind: 'person', name: 'Daniel Brooks' }, event: 'Denied claim after policy review', claimId: 'CLM-2026-004788' },
]
