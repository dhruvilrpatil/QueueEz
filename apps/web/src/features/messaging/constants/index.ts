import { ConversationCategory, ConversationStatus, ConversationPriority } from '../types';

export const CATEGORY_LABELS: Record<ConversationCategory, string> = {
  appointment: 'Appointment Query',
  queue: 'Queue & Token',
  service: 'Service Inquiry',
  facility: 'Facility & Location',
  documents: 'Required Documents',
  technical_issue: 'Technical Issue',
  payment_fees: 'Payment & Fees',
  general_query: 'General Question',
};

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_customer: 'Waiting on Customer',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

export const STATUS_STYLES: Record<ConversationStatus, { badge: string; dot: string }> = {
  open: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
  },
  in_progress: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  waiting_for_customer: {
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    dot: 'bg-purple-500',
  },
  resolved: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  closed: {
    badge: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
  },
  reopened: {
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
  },
};

export const PRIORITY_STYLES: Record<ConversationPriority, { badge: string; label: string }> = {
  low: {
    badge: 'bg-gray-100 text-gray-600 border border-gray-200',
    label: 'Low',
  },
  normal: {
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    label: 'Normal',
  },
  high: {
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    label: 'High',
  },
  urgent: {
    badge: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    label: 'Urgent',
  },
};

export const CATEGORIES_LIST: { id: ConversationCategory; label: string; description: string }[] = [
  { id: 'appointment', label: 'Appointment Query', description: 'Questions regarding your upcoming or past appointments' },
  { id: 'queue', label: 'Queue & Token', description: 'Inquiries about your token number or waiting time' },
  { id: 'service', label: 'Service Inquiry', description: 'Information regarding medical or facility services' },
  { id: 'facility', label: 'Facility & Location', description: 'Directions, parking, operating hours and accessibility' },
  { id: 'documents', label: 'Required Documents', description: 'Forms, IDs, and records required for your visit' },
  { id: 'payment_fees', label: 'Payment & Fees', description: 'Billing, copay, insurance verification or fee inquiries' },
  { id: 'technical_issue', label: 'Technical Issue', description: 'Trouble with online booking, SMS notifications or check-in' },
  { id: 'general_query', label: 'General Question', description: 'Other inquiries for facility reception and support staff' },
];
