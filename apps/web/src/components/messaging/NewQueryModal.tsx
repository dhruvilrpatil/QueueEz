import React, { useState } from 'react';
import { X, MessageSquarePlus, Calendar, Ticket, Building2, AlertCircle } from 'lucide-react';
import {
  ConversationCategory,
  CreateConversationPayload,
} from '../../features/messaging/types';
import { CATEGORIES_LIST } from '../../features/messaging/constants';

interface PreloadedContext {
  appointment?: {
    id: string;
    booking_reference: string;
    date: string;
    service_name?: string;
  };
  queue_ticket?: {
    id: string;
    ticket_number: string;
    service_name?: string;
  };
  facility_id?: string;
  facility_name?: string;
}

interface NewQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateConversationPayload) => Promise<void>;
  preloadedContext?: PreloadedContext;
}

const DEFAULT_FACILITY_ID = '00000000-0000-0000-0000-000000000010';

export const NewQueryModal: React.FC<NewQueryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preloadedContext,
}) => {
  const [subject, setSubject] = useState(
    preloadedContext?.appointment
      ? `Query regarding appointment ${preloadedContext.appointment.booking_reference}`
      : preloadedContext?.queue_ticket
      ? `Question about token #${preloadedContext.queue_ticket.ticket_number}`
      : ''
  );
  const [category, setCategory] = useState<ConversationCategory>(
    preloadedContext?.appointment
      ? 'appointment'
      : preloadedContext?.queue_ticket
      ? 'queue'
      : 'general_query'
  );
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      await onSubmit({
        facility_id: preloadedContext?.facility_id || DEFAULT_FACILITY_ID,
        subject: subject.trim(),
        category,
        message: message.trim(),
        appointment_id: preloadedContext?.appointment?.id || null,
        queue_ticket_id: preloadedContext?.queue_ticket?.id || null,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#111111]">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111111]">Ask a Question</h3>
              <p className="text-xs text-[#6B7280]">Staff at your facility will respond to your query</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-[#111111] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pre-populated Context Pill if present */}
          {(preloadedContext?.appointment || preloadedContext?.queue_ticket) && (
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center gap-3">
              {preloadedContext.appointment && (
                <div className="flex items-center gap-2 text-xs text-blue-900">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Linked Appointment: </span>
                    <span className="font-mono">{preloadedContext.appointment.booking_reference}</span>
                  </div>
                </div>
              )}
              {preloadedContext.queue_ticket && (
                <div className="flex items-center gap-2 text-xs text-emerald-900">
                  <Ticket className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Linked Token: </span>
                    <span className="font-mono">#{preloadedContext.queue_ticket.ticket_number}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Facility Display */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Facility: <strong className="text-[#111111]">{preloadedContext?.facility_name || 'Metro Health Downtown Center'}</strong></span>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Query Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ConversationCategory)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} – {cat.description}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Input */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Appointment timing & parking inquiry"
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Message Details
            </label>
            <textarea
              required
              rows={4}
              maxLength={10000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide any details or questions so staff can assist you promptly..."
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors shadow-xs ${
                submitting || !subject.trim() || !message.trim()
                  ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                  : 'bg-[#111111] hover:bg-[#242424]'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
