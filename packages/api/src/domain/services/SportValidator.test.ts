import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';

describe('SportValidator', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
    } as unknown as SportRepository;

    const validator = new SportValidator(mockSportRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateCapacity', () => {
        it('debe pasar si el cupo es mayor a cero', () => {
            expect(() => validator.validateCapacity(10)).not.toThrow();
            expect(() => validator.validateCapacity(1)).not.toThrow();
        });

        it('debe lanzar error si el cupo es cero o negativo', () => {
            expect(() => validator.validateCapacity(0)).toThrow('El cupo debe ser mayor a cero');
            expect(() => validator.validateCapacity(-5)).toThrow('El cupo debe ser mayor a cero');
        });
    });

    describe('validatePrice', () => {
        it('debe pasar si el precio es cero o mayor', () => {
            expect(() => validator.validatePrice(0)).not.toThrow();
            expect(() => validator.validatePrice(1500)).not.toThrow();
        });

        it('debe lanzar error si el precio es negativo', () => {
            expect(() => validator.validatePrice(-100)).toThrow('El precio no puede ser negativo');
        });
    });

    describe('validateNameIsUnique', () => {
        it('debe pasar si el nombre del deporte no existe', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
            
            await expect(validator.validateNameIsUnique('Futbol')).resolves.not.toThrow();
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Futbol');
        });

        it('debe lanzar error si el nombre del deporte ya existe', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({ id: '1', name: 'Futbol' } as any);
            
            await expect(validator.validateNameIsUnique('Futbol')).rejects.toThrow('Ya existe un deporte con ese nombre');
        });
    });
});
