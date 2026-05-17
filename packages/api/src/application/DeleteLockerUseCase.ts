import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async execute(id: string): Promise<void> {
        const existingLocker = await this.lockerRepo.findById(id);
        if (!existingLocker) {
            throw new Error('El casillero no existe');
        }

        // REGLA DEL TDD-0012: Bloquear si está asignado
        if (existingLocker.member_id || existingLocker.status === 'Occupied') {
            throw new Error('No se puede eliminar un casillero asignado');
        }

        await this.lockerRepo.delete(id);
    }
}