import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, ChevronRight, Building2, Calendar, ArrowLeft, Check, Shield } from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import type { Facility } from '@/types';
import { CustomerBookingWizard, WizardMode } from '@/components/customer/CustomerBookingWizard';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'bank', label: 'Bank' },
  { value: 'government', label: 'Government' },
  { value: 'college', label: 'College' },
  { value: 'service_center', label: 'Service Center' },
  { value: 'diagnostic', label: 'Diagnostic' },
];

function FacilityCard({ facility }: { facility: Facility }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-canvas border border-hairline rounded-xl p-6 hover:border-ink/30 transition-all cursor-pointer hover:shadow-soft"
      onClick={() => navigate(`/facilities/${facility.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center">
          <Building2 size={18} className="text-muted" />
        </div>
        <Badge variant="default" className="capitalize">{facility.category}</Badge>
      </div>

      <h3 className="text-title-sm text-ink mb-1">{facility.name}</h3>
      {facility.description && (
        <p className="text-body-sm text-muted mb-3 line-clamp-2">{facility.description}</p>
      )}

      <div className="flex items-center gap-1.5 text-caption text-muted mb-4">
        <MapPin size={12} />
        {facility.city}, {facility.country}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-caption text-muted">
          <Clock size={12} />
          ~{facility.avg_service_time_minutes}m avg service
        </div>
        <ChevronRight size={14} className="text-muted" />
      </div>
    </div>
  );
}

export function FacilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['facilities', { category, search }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      return apiClient.get<{ success: true; data: Facility[] }>(`/facilities?${params}`);
    },
  });

  const facilities = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ ...(category && { category }), ...(search && { search }) });
  };

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <div className="container-content py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md font-semibold text-ink mb-2">Browse Facilities</h1>
          <p className="text-body-sm text-muted">
            Find clinics, banks, government offices, and more near you.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facilities..."
              icon={<Search size={16} />}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        {/* Category filter */}
        <div className="nav-pill-group mb-8 w-fit">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              className={`nav-pill ${category === value ? 'active' : ''}`}
              onClick={() => setSearchParams(value ? { category: value } : {})}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-44 rounded-xl" />
            ))}
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 size={24} />}
            title="No facilities found"
            description="Try adjusting your search or filter."
          />
        )}
      </div>

      <PublicFooter />
    </div>
  );
}

export function FacilityDetailPage() {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<WizardMode>('appointment');
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);

  const targetFacilityId = facilityId || '00000000-0000-0000-0000-000000000010';

  const { data: facilityRes, isLoading } = useQuery({
    queryKey: ['facility', targetFacilityId],
    queryFn: () => apiClient.get<{ success: true; data: Facility }>(`/facilities/${targetFacilityId}`),
  });

  const facility = facilityRes?.data;
  const facilityName = facility?.name || 'Metro General Hospital';
  const facilityAddress = facility?.address || '100 Medical Center Dr';
  const facilityCity = facility?.city || 'Metro City';
  const avgWait = facility?.avg_service_time_minutes || 12;

  const services = facility?.services || [
    { id: '00000000-0000-0000-0000-000000000020', name: 'General Consultation', description: 'Routine checkup with general physician', duration_minutes: 15, allows_appointment: true, allows_walk_in: true },
    { id: '00000000-0000-0000-0000-000000000021', name: 'Specialist Consultation', description: 'Specialist doctor consultation', duration_minutes: 30, allows_appointment: true, allows_walk_in: false },
    { id: '00000000-0000-0000-0000-000000000025', name: 'Diagnostic Lab Test', description: 'Pathology & sample collection', duration_minutes: 10, allows_appointment: true, allows_walk_in: true },
  ];

  const handleOpenQueue = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setWizardMode('queue');
    setWizardOpen(true);
  };

  const handleOpenAppointment = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setWizardMode('appointment');
    setWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <div className="container-content py-10 max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate('/facilities')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to facilities</span>
        </button>

        {/* Facility Hero Card */}
        <div className="bg-canvas border border-hairline rounded-2xl p-6 sm:p-8 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Open Now
                </span>
                <span className="text-xs text-muted capitalize">{facility?.category || 'Healthcare & Services'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight mb-2">
                {facilityName}
              </h1>
              <p className="text-sm text-muted flex items-center gap-1.5 mb-1">
                <MapPin size={14} /> {facilityAddress}, {facilityCity}
              </p>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Clock size={14} /> Open Mon-Sat • Average service ~{avgWait} mins
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button onClick={() => handleOpenQueue()}>
                <Clock size={16} /> Join Virtual Queue
              </Button>
              <Button variant="secondary" onClick={() => handleOpenAppointment()}>
                <Calendar size={16} /> Book Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Department / Services Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-ink mb-4 font-display">Available Services & Departments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id || srv.name}
                className="bg-white border border-hairline rounded-xl p-5 hover:border-ink/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-bold text-ink">{srv.name}</h3>
                    <span className="text-xs text-muted font-medium bg-surface-soft px-2 py-0.5 rounded border border-hairline">
                      {srv.duration_minutes || 30}m duration
                    </span>
                  </div>
                  <p className="text-xs text-muted">{srv.description || 'Specialized consultation and services'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenQueue(srv.id)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Join line →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAppointment(srv.id)}
                    className="text-xs font-semibold text-ink hover:text-primary transition-colors cursor-pointer bg-surface-soft px-2.5 py-1 rounded-md border border-hairline"
                  >
                    Schedule slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PublicFooter />

      {/* Interactive Wizard with Preselected Context */}
      <CustomerBookingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialMode={wizardMode}
        initialFacilityId={targetFacilityId}
        initialServiceId={selectedServiceId}
      />
    </div>
  );
}
