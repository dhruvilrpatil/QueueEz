import { z } from 'zod';

export const createFacilitySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'clinic',
    'bank',
    'government',
    'college',
    'service_center',
    'diagnostic',
    'other',
  ]),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  country: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  max_queue_size: z.number().int().min(1).max(1000).default(100),
  avg_service_time_minutes: z.number().int().min(1).max(120).default(15),
});

export const updateFacilitySchema = createFacilitySchema.partial();

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
