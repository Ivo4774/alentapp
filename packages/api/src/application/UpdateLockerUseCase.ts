import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Verificar existencia en la DB
        const existingLocker = await this.lockerRepo.findById(id);
        if (!existingLocker) {
            throw new Error('El casillero no existe'); 
        }

        // 2. Validar duplicidad del Número si se envió y cambió
        if (data.number !== undefined && data.number !== existingLocker.number) {
            
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        // 3. Delegar la persistencia real al repositorio externo
        return await this.lockerRepo.update(id, data);
    }
}