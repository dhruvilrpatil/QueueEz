import React from 'react';
import { User, Calendar, Ticket, Clock, Building2, Phone, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Conversation } from '../../features/messaging/types';

interface ConversationContextProps {
  conversation: Conversation;
  className?: string;
}

export const ConversationContext: React.FC<ConversationContextProps> = ({
  conversation,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-white border-b lg:border-b-0 lg:border-l border-[#E5E7EB] space-y-4 ${className}`}>
      <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
        Context & References
      </h4>

      {/* Customer profile card */}
      <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {conversation.customer?.full_name ? conversation.customer.full_name.charAt(0) : 'C'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111111] truncate">
              {conversation.customer?.full_name || 'Customer'}
            </p>
            <p className="text-[11px] text-[#6B7280] truncate">Verified Customer</p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB] space-y-1 text-xs text-[#4B5563]">
          {conversation.customer?.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <span className="truncate">{conversation.customer.email}</span>
            </div>
          )}
          {conversation.customer?.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <span>{conversation.customer.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Context if linked */}
      {conversation.appointment && (
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Appointment Context
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
              {conversation.appointment.status}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-semibold text-blue-950">
              Ref: {conversation.appointment.booking_reference}
            </p>
            <p className="text-blue-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {conversation.appointment.date} · {conversation.appointment.start_time}
            </p>
            {conversation.appointment.service_name && (
              <p className="text-blue-700 text-[11px]">
                Service: {conversation.appointment.service_name}
              </p>
            )}
          </div>

          <Link
            to={`/staff/appointments`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 pt-1"
          >
            <span>View in Appointments</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Queue Ticket Context if linked */}
      {conversation.queue_ticket && (
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900">
              <Ticket className="w-3.5 h-3.5 text-emerald-700" />
              Queue Token Context
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
              {conversation.queue_ticket.status}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-base font-bold text-emerald-950 font-mono">
              Token #{conversation.queue_ticket.ticket_number}
            </p>
            <p className="text-emerald-800">
              {conversation.queue_ticket.position} people ahead
              {conversation.queue_ticket.estimated_wait_minutes
                ? ` (~${conversation.queue_ticket.estimated_wait_minutes} min)`
                : ''}
            </p>
            {conversation.queue_ticket.service_name && (
              <p className="text-emerald-700 text-[11px]">
                Service: {conversation.queue_ticket.service_name}
              </p>
            )}
          </div>

          <Link
            to={`/staff/queue`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 pt-1"
          >
            <span>View in Queue Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Facility Information */}
      {conversation.facility && (
        <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] space-y-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111]">
            <Building2 className="w-3.5 h-3.5 text-[#6B7280]" />
            Facility
          </span>
          <p className="text-xs font-medium text-[#374151]">{conversation.facility.name}</p>
          {conversation.facility.address && (
            <p className="text-[11px] text-[#6B7280]">
              {conversation.facility.address}, {conversation.facility.city}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
