import { UpdateSportRequest, SportDTO } from '@alentapp/shared';
import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(id: string, data: any): Promise<SportDTO> {
        
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        this.sportValidator.validateNameUnchanged(data.name, existingSport.name);
        this.sportValidator.validateUpdateCapacity(data.max_capacity);

        const cleanData: UpdateSportRequest = {
            description: data.description ?? existingSport.description,
            max_capacity: data.max_capacity !== undefined ? Number(data.max_capacity) : existingSport.max_capacity
        };

        return await this.sportRepo.update(id, cleanData);
    }
}