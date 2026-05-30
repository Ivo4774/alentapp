import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

    validateCapacity(capacity: number): void {
        if (capacity <= 0) {
            throw new Error('El cupo debe ser mayor a cero');
        }
    }

    validateUpdateCapacity(capacity: number | undefined): void {
        if (capacity !== undefined && capacity <= 0) {
            throw new Error('La nueva capacidad debe ser mayor a cero');
        }
    }

    validatePrice(price: number): void {
        if (price < 0) {
            throw new Error('El precio no puede ser negativo');
        }
    }

    async validateNameIsUnique(name: string): Promise<void> {
        const existingSport = await this.sportRepo.findByName(name);
        if (existingSport) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }

    validateNameUnchanged(newName: string | undefined, existingName: string): void {
        if (newName && newName !== existingName) {
            throw new Error('El nombre del deporte es inmutable');
        }
    }
}
