import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        // 0. Validar campos obligatorios según el TDD-0010
        if (data.number === undefined || data.number === null || !data.location || data.location.trim() === '') {
            throw new Error('El número y la ubicación son obligatorios');
        }

        // 1. Validaciones de negocio (centralizadas)
        await this.lockerValidator.validateNumberIsUnique(data.number);

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoLocker = await this.lockerRepository.create({
            ...data,
            status: 'Available', // Regla de negocio: todos nacen disponibles
            member_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return nuevoLocker;
    }
}