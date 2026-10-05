import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppSidebar';
import { BookingWizard } from '@/features/booking';

export function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const facilityId = searchParams.get('facilityId') || undefined;
  const serviceId = searchParams.get('serviceId') || undefined;
  const date = searchParams.get('date') || undefined;

  return (
    <AppLayout role="customer">
      <div className="max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Centered Booking Container (Sections 18-20) */}
        <div className="w-full">
          <BookingWizard
            isModal={false}
            initialFacilityId={facilityId}
            initialServiceId={serviceId}
            initialDate={date}
            onClose={() => navigate('/app/appointments')}
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default BookingPage;
