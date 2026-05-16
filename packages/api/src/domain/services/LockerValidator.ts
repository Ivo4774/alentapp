import { LockerRepository } from '../LockerRepository.js';

export class LockerValidator {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        // Le pedimos al repositorio que busque si ya hay un locker con este número
        const lockerWithSameNumber = await this.lockerRepo.findByNumber(number);
        
        // Si existe, y su ID no es el del casillero que estamos editando (esto servirá para el update)
        if (lockerWithSameNumber && lockerWithSameNumber.id !== excludeLockerId) {
            throw new Error('Ya existe un casillero con ese número'); // Este es el texto exacto que atrapa el controlador
        }
    }

    
}