import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(): Promise<LockerDTO[]> {
        const lockers = await this.lockerRepository.findAll();
        
        // Retornamos los lockers asegurando que viaje todo el DTO completo
        return lockers.map(locker => ({
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id,
            created_at: locker.created_at,
            updated_at: locker.updated_at
        }));
    }
}