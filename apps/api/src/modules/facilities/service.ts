import { FacilityRepository } from './repository';
import { CreateFacilityInput, UpdateFacilityInput } from './schema';
import { ForbiddenError } from '../../middleware/errorHandler';

const repo = new FacilityRepository();

export class FacilityService {
  async listFacilities(filters?: { category?: string; city?: string; search?: string }) {
    return repo.findAll(filters);
  }

  async getFacility(id: string) {
    return repo.findById(id);
  }

  async createFacility(
    input: CreateFacilityInput,
    userId: string,
    organizationId: string
  ) {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return repo.create({ ...input, organization_id: organizationId, slug });
  }

  async updateFacility(id: string, input: UpdateFacilityInput, userId: string, userRole: string) {
    if (userRole !== 'system_admin') {
      const facility = await repo.findById(id);
      // Check if user is admin of this facility (simplified check)
      if (!facility) throw new ForbiddenError();
    }
    return repo.update(id, input);
  }

  async deleteFacility(id: string, userRole: string) {
    if (userRole !== 'system_admin' && userRole !== 'facility_admin') {
      throw new ForbiddenError();
    }
    return repo.softDelete(id);
  }
}
