import { SportDTO } from '@alentapp/shared';
import { SportRepository } from '../../domain/SportRepository.js';

export class CreateSportUseCase {
  constructor(private readonly sportRepo: SportRepository) {}

  async execute(data: Omit<SportDTO, 'id' | 'created_at'>): Promise<SportDTO> {
  
    if (data.max_capacity <= 0) {
      throw new Error('El cupo debe ser mayor a cero');
    }

    if (data.additional_price < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    const existingSport = await this.sportRepo.findByName(data.name);
    if (existingSport) {
      throw new Error('Ya existe un deporte con ese nombre');
    }

    return await this.sportRepo.create(data);
  }
}