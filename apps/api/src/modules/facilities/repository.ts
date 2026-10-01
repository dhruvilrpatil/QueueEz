import { supabaseAdmin } from '../../lib/supabase';
import { CreateFacilityInput, UpdateFacilityInput } from './schema';
import { NotFoundError } from '../../middleware/errorHandler';

export class FacilityRepository {
  async findAll(filters?: { category?: string; city?: string; search?: string }) {
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
    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string) {
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

    if (error || !data) throw new NotFoundError('Facility');
    return data;
  }

  async findBySlug(slug: string) {
    const { data, error } = await supabaseAdmin
      .from('facilities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) throw new NotFoundError('Facility');
    return data;
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
