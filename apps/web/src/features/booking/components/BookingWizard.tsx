import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBooking } from '../hooks/useBooking';
import { useAvailability } from '../hooks/useAvailability';
import { BookingProgress } from './BookingProgress';
import { ServiceSelector } from './ServiceSelector';
import { DateSelector } from './DateSelector';
import { TimeSlotGrid } from './TimeSlotGrid';
import { BookingSummary } from './BookingSummary';
import { BookingReview } from './BookingReview';
import { BookingSuccess } from './BookingSuccess';
import { BookingError } from './BookingError';
import type { BookingResult } from '../types/booking';

export interface BookingWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  initialFacilityId?: string;
  initialServiceId?: string;
  initialDate?: string;
  initialNotes?: string;
  onSuccess?: (result: BookingResult) => void;
}

export function BookingWizard({
  isOpen = true,
  onClose,
  isModal = true,
  initialFacilityId,
  initialServiceId,
  initialDate,
  initialNotes,
  onSuccess,
}: BookingWizardProps) {
  const {
    step,
    setStep,
    goNext,
    goBack,
    retryTimeSelection,
    reset,
    selectedFacilityId,
    selectedServiceId,
    selectedDate,
    selectedTime,
    selectedTimeLabel,
    notes,
    setNotes,
    facilities,
    activeFacility,
    availableServices,
    activeService,
    isLoading,
    isSubmitting,
    result,
    error,
    selectFacility,
    selectService,
    selectDate,
    selectTime,
    submitBooking,
  } = useBooking({
    initialFacilityId,
    initialServiceId,
    initialDate,
    initialNotes,
    onSuccess,
    onClose,
  });

  // Query availability for Step 2
  const {
    morningSlots,
    afternoonSlots,
    eveningSlots,
    isLoading: isSlotsLoading,
  } = useAvailability({
    facilityId: selectedFacilityId,
    serviceId: selectedServiceId,
    date: selectedDate,
    enabled: step === 2 && Boolean(selectedFacilityId && selectedServiceId),
  });

  if (isModal && !isOpen) return null;

  // ── Render Content inside Wizard ──────────────────────────────────────────
  const wizardContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-hairline flex items-center justify-between bg-surface-soft/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight font-display">
            {result ? 'Appointment Confirmation' : 'Schedule an Appointment'}
          </h2>
          <p className="text-xs text-muted">
            {activeFacility?.name || 'EzQueue Smart Booking'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Progress Steps (Visible during steps 1, 2, 3) */}
      {!result && !error && (
        <div className="px-4 sm:px-6 pt-5 pb-3 border-b border-hairline-soft bg-canvas">
          <BookingProgress
            currentStep={step}
            onStepClick={(targetStep) => {
              if (targetStep < step) {
                setStep(targetStep);
              }
            }}
          />
        </div>
      )}

      {/* Main Body */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        {result ? (
          <BookingSuccess result={result} onClose={onClose} />
        ) : error ? (
          <BookingError
            error={error}
            onRetryTime={retryTimeSelection}
            onReset={reset}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Step Content */}
            <div className="lg:col-span-8">
              {/* STEP 1: SERVICE SELECTION */}
              {step === 1 && (
                <ServiceSelector
                  services={availableServices}
                  selectedServiceId={selectedServiceId}
                  onSelectService={selectService}
                  onContinue={goNext}
                  isLoading={isLoading}
                  facility={activeFacility}
                  facilities={facilities}
                  onSelectFacility={selectFacility}
                />
              )}

              {/* STEP 2: DATE & TIME SELECTION */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-display">
                      Choose a date & time
                    </h2>
                    <p className="text-xs sm:text-sm text-muted mt-1">
                      Showing real-time doctor availability for {activeService?.name}.
                    </p>
                  </div>

                  {/* Horizontal Date Strip / Calendar Toggle */}
                  <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={selectDate}
                  />

                  {/* Grouped Morning, Afternoon, Evening Time Slots */}
                  <TimeSlotGrid
                    morningSlots={morningSlots}
                    afternoonSlots={afternoonSlots}
                    eveningSlots={eveningSlots}
                    selectedTime={selectedTime}
                    onSelectTime={selectTime}
                    isLoading={isSlotsLoading}
                    onTryAnotherDate={() => {
                      // pick tomorrow
                      const curr = new Date(selectedDate);
                      curr.setDate(curr.getDate() + 1);
                      selectDate(curr.toISOString().split('T')[0]);
                    }}
                    queueHint={
                      activeFacility?.avg_service_time_minutes
                        ? `~${activeFacility.avg_service_time_minutes}m avg service`
                        : undefined
                    }
                  />

                  {/* Navigation Footer */}
                  <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!selectedTime}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                        selectedTime
                          ? 'bg-primary hover:bg-primary-active text-on-primary'
                          : 'bg-hairline text-muted cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>Continue</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & CONFIRM */}
              {step === 3 && (
                <BookingReview
                  facility={activeFacility}
                  service={activeService}
                  date={selectedDate}
                  timeLabel={selectedTimeLabel}
                  notes={notes}
                  onNotesChange={setNotes}
                  onConfirm={submitBooking}
                  onBack={goBack}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>

            {/* Persistent Appointment Summary (Sidebar on Desktop, Accordion on Mobile) */}
            <div className="lg:col-span-4">
              <BookingSummary
                facility={activeFacility}
                service={activeService}
                date={step >= 2 ? selectedDate : undefined}
                timeLabel={step >= 2 ? selectedTimeLabel : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If used as a modal overlay
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
          {wizardContent}
        </div>
      </div>
    );
  }

  // If embedded directly on a page
  return (
    <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-3xl mx-auto overflow-hidden shadow-sm">
      {wizardContent}
    </div>
  );
}

export default BookingWizard;
