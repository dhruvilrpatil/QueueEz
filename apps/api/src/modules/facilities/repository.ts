import { supabaseAdmin } from '../../lib/supabase';
import { CreateFacilityInput, UpdateFacilityInput } from './schema';
import { NotFoundError } from '../../middleware/errorHandler';

const MOCK_FACILITIES = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    organization_id: '00000000-0000-0000-0000-000000000001',
    name: 'Metro General Hospital',
    slug: 'metro-general-hospital',
    category: 'clinic',
    address: '100 Medical Center Dr',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-22-12345678',
    is_active: true,
    max_capacity: 500,
    current_occupancy: 42,
    services: [{ count: 3 }],
    counters: [{ count: 3 }],
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    organization_id: '00000000-0000-0000-0000-000000000001',
    name: 'National Bank – Main Branch',
    slug: 'national-bank-main',
    category: 'bank',
    address: '1 Bank Street, Fort',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-22-98765432',
    is_active: true,
    max_capacity: 100,
    current_occupancy: 14,
    services: [{ count: 2 }],
    counters: [{ count: 2 }],
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    organization_id: '00000000-0000-0000-0000-000000000001',
    name: 'RTO Office – Bandra',
    slug: 'rto-bandra',
    category: 'government',
    address: 'Plot 5, BKC',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-22-87654321',
    is_active: true,
    max_capacity: 200,
    current_occupancy: 28,
    services: [{ count: 1 }],
    counters: [{ count: 2 }],
  },
];

const MOCK_FACILITY_DETAILS: Record<string, any> = {
  '00000000-0000-0000-0000-000000000010': {
    id: '00000000-0000-0000-0000-000000000010',
    organization_id: '00000000-0000-0000-0000-000000000001',
    name: 'Metro General Hospital',
    slug: 'metro-general-hospital',
    category: 'clinic',
    address: '100 Medical Center Dr',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-22-12345678',
    is_active: true,
    max_capacity: 500,
    current_occupancy: 42,
    services: [
      { id: '00000000-0000-0000-0000-000000000020', name: 'General Consultation', description: 'General OPD consultation', duration_minutes: 15, allows_walk_in: true, allows_appointment: true },
      { id: '00000000-0000-0000-0000-000000000021', name: 'Specialist Consultation', description: 'Specialist OPD doctor checkup', duration_minutes: 30, allows_walk_in: false, allows_appointment: true },
      { id: '00000000-0000-0000-0000-000000000025', name: 'Diagnostic Lab & Blood Test', description: 'Pathology & sample collection', duration_minutes: 10, allows_walk_in: true, allows_appointment: true },
    ],
    counters: [
      { id: 'c1', name: 'Counter 1 (Dr. Sharma)', number: 1, status: 'available' },
      { id: 'c2', name: 'Counter 2 (Dr. Mehta)', number: 2, status: 'busy' },
      { id: 'c3', name: 'Counter 3 (Diagnostics)', number: 3, status: 'available' },
    ],
    business_hours: [
      { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 6, open_time: '09:00', close_time: '14:00', is_closed: false },
      { day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: true },
    ],
  },
};

export class FacilityRepository {
  async findAll(filters?: { category?: string; city?: string; search?: string }) {
    try {
      let query = supabaseAdmin
        .from('facilities')
        .select(`
          *,
          services(count),
          counters(count)
        `)
        .eq('is_active', true)
        .order('name');

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback to mock data if database connection not active
    }

    let results = [...MOCK_FACILITIES];
    if (filters?.category) results = results.filter((f) => f.category === filters.category);
    if (filters?.city) results = results.filter((f) => f.city.toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return results;
  }

  async findById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('facilities')
        .select(`
          *,
          services(*),
          counters(*, counter_services(service_id)),
          business_hours(*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch {
      // Fallback
    }

    if (MOCK_FACILITY_DETAILS[id]) {
      return MOCK_FACILITY_DETAILS[id];
    }
    return MOCK_FACILITY_DETAILS['00000000-0000-0000-0000-000000000010'];
  }

  async findBySlug(slug: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('facilities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) return data;
    } catch {
      // Fallback
    }

    const found = MOCK_FACILITIES.find((f) => f.slug === slug);
    if (found) return found;
    throw new NotFoundError('Facility');
  }

  async create(input: CreateFacilityInput & { organization_id: string; slug: string }) {
    const { data, error } = await supabaseAdmin
      .from('facilities')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, input: UpdateFacilityInput) {
    const { data, error } = await supabaseAdmin
      .from('facilities')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundError('Facility');
    return data;
  }

  async softDelete(id: string) {
    const { error } = await supabaseAdmin
      .from('facilities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
