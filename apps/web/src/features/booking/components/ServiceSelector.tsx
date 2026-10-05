import React from 'react';
import { Building2, ChevronRight, AlertCircle } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import type { Service, Facility } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
  onContinue: () => void;
  isLoading?: boolean;
  facility?: Facility;
  facilities?: Facility[];
  onSelectFacility?: (facilityId: string) => void;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService,
  onContinue,
  isLoading = false,
  facility,
  facilities = [],
  onSelectFacility,
}: ServiceSelectorProps) {
  const hasMultipleFacilities = facilities.length > 1 && Boolean(onSelectFacility);

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-display">
          Book an Appointment
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Choose the service you need.
        </p>
      </div>

      {/* Facility Context Indicator / Selector */}
      {facility && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface-soft border border-hairline rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-muted" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink leading-tight">{facility.name}</p>
              <p className="text-[11px] text-muted">{facility.address}, {facility.city}</p>
            </div>
          </div>

          {hasMultipleFacilities && (
            <select
              value={facility.id}
              onChange={(e) => onSelectFacility?.(e.target.value)}
              className="text-xs font-semibold text-ink bg-white border border-hairline rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-ink/30 transition-colors"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Services List / Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : services.length > 0 ? (
        <div className="space-y-2.5">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServiceId === service.id}
              onSelect={() => onSelectService(service.id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-hairline rounded-xl bg-surface-soft/50 space-y-2">
          <AlertCircle size={24} className="mx-auto text-muted" />
          <p className="text-sm font-semibold text-ink">No services available</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            This facility currently has no active services accepting advance appointments.
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-hairline flex items-center justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedServiceId}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
            selectedServiceId
              ? 'bg-primary hover:bg-primary-active text-on-primary'
              : 'bg-hairline text-muted cursor-not-allowed opacity-60'
          }`}
        >
          <span>Continue</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
