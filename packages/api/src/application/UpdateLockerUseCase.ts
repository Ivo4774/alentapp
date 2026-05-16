import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Verificar existencia en la DB (Igual que en Member)
        const existingLocker = await this.lockerRepo.findById(id);
        if (!existingLocker) {
            // Texto literal para que el Controller lo mapee a un 404 Not Found
            throw new Error('El casillero no existe'); 
        }

        // 2. Validar duplicidad del Número si se envió y cambió
        if (data.number !== undefined && data.number !== existingLocker.number) {
            // El validador ya se encarga de tirar "Ya existe un casillero con ese número" (409 Conflict)
            await this.lockerValidator.validateUniqueNumber(data.number);
        }

        // 3. Delegar la persistencia real al repositorio externo
        return await this.lockerRepo.update(id, data);
    }
}