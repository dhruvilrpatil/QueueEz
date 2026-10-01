import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, ChevronRight, Building2 } from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import type { Facility } from '@/types';

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

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="container-content py-12">
        <p className="text-muted">Facility details page — coming soon</p>
      </div>
      <PublicFooter />
    </div>
  );
}
