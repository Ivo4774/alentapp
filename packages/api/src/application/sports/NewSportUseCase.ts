import { SportDTO } from '@alentapp/shared';
import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';

export class CreateSportUseCase {
  constructor(
    private readonly sportRepo: SportRepository,
    private readonly sportValidator: SportValidator
  ) {}

  async execute(data: Omit<SportDTO, 'id' | 'created_at'>): Promise<SportDTO> {
  
    this.sportValidator.validateCapacity(data.max_capacity);
    this.sportValidator.validatePrice(data.additional_price);
    await this.sportValidator.validateNameIsUnique(data.name);

    return await this.sportRepo.create(data);
  }
}