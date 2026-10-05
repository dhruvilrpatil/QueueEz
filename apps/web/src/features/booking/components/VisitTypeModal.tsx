import React from 'react';
import { Calendar, Clock, ChevronRight, X, Sparkles } from 'lucide-react';
import type { Facility } from '@/types';

interface VisitTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility?: Facility;
  onChooseAppointment: () => void;
  onChooseQueue: () => void;
}

export function VisitTypeModal({
  isOpen,
  onClose,
  facility,
  onChooseAppointment,
  onChooseQueue,
}: VisitTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink font-display tracking-tight">
              How would you like to visit?
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {facility ? facility.name : 'Select your visit preference'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Option 1: Book an Appointment */}
          <button
            type="button"
            onClick={onChooseAppointment}
            className="w-full p-4 rounded-xl border border-hairline hover:border-ink/40 bg-canvas hover:bg-surface-soft/60 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  Book an Appointment
                </h4>
                <ChevronRight size={14} className="text-muted group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted mt-0.5">
                Choose a specific date and time in advance. Recommended for planned consultations.
              </p>
            </div>
          </button>

          {/* Option 2: Join Virtual Queue */}
          <button
            type="button"
            onClick={onChooseQueue}
            className="w-full p-4 rounded-xl border border-hairline hover:border-ink/40 bg-canvas hover:bg-surface-soft/60 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-ink group-hover:text-emerald-700 transition-colors">
                  Join Virtual Queue
                </h4>
                <ChevronRight size={14} className="text-muted group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted mt-0.5">
                Join the live waiting line today. Get served based on real-time counter position.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
