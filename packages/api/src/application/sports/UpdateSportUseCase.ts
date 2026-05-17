import { UpdateSportRequest, SportDTO } from '@alentapp/shared';
import { SportRepository } from '../../domain/SportRepository.js';

export class UpdateSportUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(id: string, data: any): Promise<SportDTO> {
        
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        if (data.name && data.name !== existingSport.name) {
            throw new Error('El nombre del deporte es inmutable');
        }

        if (data.max_capacity !== undefined && data.max_capacity <= 0) {
            throw new Error('La nueva capacidad debe ser mayor a cero');
        }

        const cleanData: UpdateSportRequest = {
            description: data.description ?? existingSport.description,
            max_capacity: data.max_capacity !== undefined ? Number(data.max_capacity) : existingSport.max_capacity
        };

        return await this.sportRepo.update(id, cleanData);
    }
}