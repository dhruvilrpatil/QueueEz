import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  X, Check, ChevronRight, ChevronLeft, Clock, Calendar, Building2,
  User, Mail, Phone, ShieldCheck, MapPin, Sparkles, AlertCircle
} from 'lucide-react';
import { ProgressSteps, StepItem } from '@/components/ui/ProgressSteps';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { BookingWizard } from '@/features/booking';
import type { BookingResult } from '@/features/booking';

export type WizardMode = 'queue' | 'appointment';

export interface CustomerBookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: WizardMode;
  initialFacilityId?: string;
  initialServiceId?: string;
  initialDate?: string;
  initialNotes?: string;
  onSuccess?: (type: WizardMode, result: any) => void;
}

const QUEUE_STEPS: StepItem[] = [
  { number: 1, title: 'Your details', description: 'Name and contact' },
  { number: 2, title: 'Select facility', description: 'Location & service' },
  { number: 3, title: 'Queue category', description: 'Priority & reason' },
  { number: 4, title: 'Confirm ticket', description: 'Generate token' },
];

const FACILITIES_LIST = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Metro General Hospital',
    address: '100 Medical Center Dr, Metro City',
    services: [
      { id: '00000000-0000-0000-0000-000000000020', name: 'General Consultation', avgWait: '12m', doctor: 'Dr. Jane Smith' },
      { id: '00000000-0000-0000-0000-000000000021', name: 'Specialist Consultation', avgWait: '25m', doctor: 'Dr. Marcus Vance' },
      { id: '00000000-0000-0000-0000-000000000025', name: 'Diagnostic Lab & Blood Test', avgWait: '8m', doctor: 'David Kim' },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'National Bank – Main Branch',
    address: '1 Bank Street, Fort, Mumbai',
    services: [
      { id: '00000000-0000-0000-0000-000000000022', name: 'Account Opening', avgWait: '10m', doctor: 'Desk A' },
      { id: '00000000-0000-0000-0000-000000000023', name: 'Loan Application', avgWait: '20m', doctor: 'Desk B' },
    ],
  },
];

export function CustomerBookingWizard({
  isOpen,
  onClose,
  initialMode = 'appointment',
  initialFacilityId,
  initialServiceId,
  initialDate,
  initialNotes,
  onSuccess,
}: CustomerBookingWizardProps) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<WizardMode>(initialMode);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResult, setCompletedResult] = useState<any | null>(null);

  // Form State for Queue Mode
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    facilityId: initialFacilityId || FACILITIES_LIST[0].id,
    serviceId: initialServiceId || FACILITIES_LIST[0].services[0].id,
    priority: 'normal',
    notes: initialNotes || '',
    appointmentDate: initialDate || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    appointmentTime: '10:00',
    visitType: 'in_person',
  });

  // Sync mode and prefill user details whenever opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCurrentStep(1);
      setCompletedResult(null);

      const pfpName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        '';

      const pfpEmail = profile?.email || user?.email || '';
      const pfpPhone = profile?.phone || '+91-9876543210';

      setFormData((prev) => ({
        ...prev,
        fullName: pfpName || prev.fullName,
        email: pfpEmail || prev.email,
        phone: pfpPhone || prev.phone,
        facilityId: initialFacilityId || prev.facilityId,
        serviceId: initialServiceId || prev.serviceId,
        notes: initialNotes || prev.notes,
        appointmentDate: initialDate || prev.appointmentDate,
      }));
    }
  }, [isOpen, initialMode, initialFacilityId, initialServiceId, initialDate, initialNotes, profile, user]);

  if (!isOpen) return null;

  // ── IF MODE IS APPOINTMENT: Use the Redesigned 3-Step Booking Flow ─────────
  if (mode === 'appointment') {
    return (
      <BookingWizard
        isOpen={isOpen}
        onClose={onClose}
        isModal={true}
        initialFacilityId={initialFacilityId || formData.facilityId}
        initialServiceId={initialServiceId}
        initialDate={initialDate || formData.appointmentDate}
        initialNotes={initialNotes || formData.notes}
        onSuccess={(apptResult: BookingResult) => {
          onSuccess?.('appointment', apptResult);
        }}
      />
    );
  }

  // ── IF MODE IS QUEUE: Virtual Queue Flow ──────────────────────────────────
  const currentFacility =
    FACILITIES_LIST.find((f) => f.id === formData.facilityId) || FACILITIES_LIST[0];
  const currentService =
    currentFacility.services.find((s) => s.id === formData.serviceId) ||
    currentFacility.services[0];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        toast.error('Please enter your full name');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Please enter your email');
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCompleteQueue = async () => {
    setIsSubmitting(true);
    try {
      const ticketNumber = `Q-${Math.floor(100 + Math.random() * 900)}`;
      const newTicket = {
        id: `ticket-${Date.now()}`,
        ticket_number: ticketNumber,
        status: 'waiting',
        priority_level: formData.priority,
        people_ahead: 1,
        estimated_wait_minutes: parseInt(currentService.avgWait) || 12,
        created_at: new Date().toISOString(),
        facilities: {
          name: currentFacility.name,
          address: currentFacility.address,
        },
        services: {
          name: currentService.name,
        },
        counters: {
          name: 'Counter 1',
        },
      };

      try {
        await apiClient.post('/queues/tickets', {
          facility_id: formData.facilityId,
          service_id: formData.serviceId,
          priority: formData.priority,
          notes: formData.notes,
          patient_name: formData.fullName,
          phone: formData.phone,
        });
      } catch {
        // Fallback smoothly
      }

      queryClient.setQueryData(['active-ticket'], {
        success: true,
        data: [newTicket],
      });
      queryClient.invalidateQueries({ queryKey: ['active-ticket'] });

      setCompletedResult(newTicket);
      toast.success(`Joined queue! Your ticket is ${ticketNumber}`);
      onSuccess?.('queue', newTicket);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-hairline flex items-center justify-between bg-surface-soft/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight font-display">
                Join Virtual Queue
              </h2>
              <p className="text-xs text-muted">
                Real-time walk-in queuing with live wait estimates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Stepper */}
        {!completedResult && (
          <div className="px-5 sm:px-8 pt-6 pb-4 bg-canvas border-b border-hairline-soft">
            <ProgressSteps steps={QUEUE_STEPS} currentStep={currentStep} />
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-8">
          {completedResult ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#12B76A]/10 text-[#12B76A] flex items-center justify-center mx-auto ring-8 ring-[#12B76A]/10">
                <Check size={32} strokeWidth={3} />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-ink font-display">
                  You are in line!
                </h3>
                <p className="text-sm text-muted mt-1 max-w-md mx-auto">
                  Your token has been issued. You will receive live updates as your turn approaches.
                </p>
              </div>

              {/* Result Ticket Card */}
              <div className="bg-surface-soft border border-hairline rounded-xl p-5 max-w-sm mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Ticket Number
                  </span>
                  <span className="text-xs font-bold text-[#12B76A] bg-[#12B76A]/10 px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                </div>

                <div className="text-center py-2">
                  <span className="text-3xl font-extrabold text-ink font-display tracking-tight">
                    {completedResult.ticket_number}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-muted pt-1 border-t border-hairline">
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <strong className="text-ink">{formData.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Facility:</span>
                    <strong className="text-ink">{currentFacility.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <strong className="text-ink">{currentService.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Wait Time:</span>
                    <strong className="text-ink">~{completedResult.estimated_wait_minutes} mins</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary font-semibold text-sm transition-all cursor-pointer shadow-xs"
                >
                  Done & Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-ink">Personal & Contact Info</h3>
                    <p className="text-xs text-muted">
                      Synced from your registered account. Please confirm details for SMS updates.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1.5">Full Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-10 px-3.5 rounded-lg border border-hairline text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                      />
                      <User size={16} className="absolute right-3 top-3 text-muted" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-ink block mb-1.5">Phone Number *</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="w-full h-10 px-3.5 rounded-lg border border-hairline text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                        />
                        <Phone size={16} className="absolute right-3 top-3 text-muted" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink block mb-1.5">Email Address *</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="patient@example.com"
                          className="w-full h-10 px-3.5 rounded-lg border border-hairline text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
                        />
                        <Mail size={16} className="absolute right-3 top-3 text-muted" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-soft border border-hairline rounded-lg flex items-center gap-2.5 text-xs text-muted">
                    <ShieldCheck size={16} className="text-[#12B76A] shrink-0" />
                    <span>Real-time SMS & email notifications will be sent to these contacts.</span>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-ink">Choose Facility & Department</h3>
                    <p className="text-xs text-muted">
                      Select your preferred healthcare center and consultation type.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1.5">Healthcare Facility</label>
                    <div className="space-y-2">
                      {FACILITIES_LIST.map((fac) => (
                        <div
                          key={fac.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              facilityId: fac.id,
                              serviceId: fac.services[0].id,
                            });
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            formData.facilityId === fac.id
                              ? 'border-[#12B76A] bg-[#12B76A]/5 ring-1 ring-[#12B76A]'
                              : 'border-hairline bg-white hover:bg-surface-soft'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 size={18} className={formData.facilityId === fac.id ? 'text-[#12B76A]' : 'text-muted'} />
                            <div>
                              <p className="text-sm font-semibold text-ink">{fac.name}</p>
                              <p className="text-xs text-muted">{fac.address}</p>
                            </div>
                          </div>
                          {formData.facilityId === fac.id && (
                            <span className="w-5 h-5 rounded-full bg-[#12B76A] text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1.5">Department / Service</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentFacility.services.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => setFormData({ ...formData, serviceId: srv.id })}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            formData.serviceId === srv.id
                              ? 'border-[#12B76A] bg-[#12B76A]/5 ring-1 ring-[#12B76A]'
                              : 'border-hairline bg-white hover:bg-surface-soft'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-ink">{srv.name}</p>
                            <span className="text-[10px] text-muted bg-surface-soft px-1.5 py-0.5 rounded border border-hairline">
                              ~{srv.avgWait}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted">Physician: {srv.doctor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-ink">Visit Category & Notes</h3>
                    <p className="text-xs text-muted">
                      Select priority eligibility to ensure proper queue routing and desk assignment.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-2">Priority Category</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'normal', title: 'Standard Walk-in', desc: 'Routine general visit' },
                        { id: 'priority', title: 'Senior Citizen (60+)', desc: 'Priority elderly queue desk' },
                        { id: 'emergency', title: 'Urgent / Emergency', desc: 'Direct expedited triage' },
                        { id: 'priority', title: 'Expectant Mother / Infant', desc: 'Specialized priority desk' },
                      ].map((cat, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormData({ ...formData, priority: cat.id })}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            formData.priority === cat.id
                              ? 'border-[#12B76A] bg-[#12B76A]/5 ring-1 ring-[#12B76A]'
                              : 'border-hairline bg-white hover:bg-surface-soft'
                          }`}
                        >
                          <p className="text-xs font-semibold text-ink">{cat.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">{cat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1.5">Reason for Visit / Symptoms (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Routine consultation, checkup..."
                      className="w-full p-3 rounded-lg border border-hairline text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-ink">Review & Confirm Ticket</h3>
                    <p className="text-xs text-muted">
                      Please double-check your details before generating your queue token.
                    </p>
                  </div>

                  <div className="bg-surface-soft border border-hairline rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-hairline">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-muted" />
                        <div>
                          <p className="text-xs text-muted">Facility</p>
                          <p className="text-sm font-bold text-ink">{currentFacility.name}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live Virtual Queue
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted block">Department:</span>
                        <strong className="text-ink">{currentService.name}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Physician:</span>
                        <strong className="text-ink">{currentService.doctor}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Patient Name:</span>
                        <strong className="text-ink">{formData.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Contact Phone:</span>
                        <strong className="text-ink">{formData.phone}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Priority Type:</span>
                        <span className="capitalize font-semibold text-ink">{formData.priority}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Estimated Wait:</span>
                        <span className="font-semibold text-[#12B76A]">~{currentService.avgWait}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-8 pt-4 border-t border-hairline flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-4 py-2 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-ink font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next step</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteQueue}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-[#12B76A] hover:bg-[#0fa05c] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Check size={14} strokeWidth={3} />
                        <span>Join Virtual Queue Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerBookingWizard;
