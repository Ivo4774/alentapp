import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';

describe('SportValidator', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
    } as unknown as SportRepository;

    const validator = new SportValidator(mockSportRepo);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('validateCapacity', () => {
        it('debe pasar si el cupo es mayor a cero (ej: 10)', () => {
            expect(() => validator.validateCapacity(10)).not.toThrow();
        });

        it('debe pasar si el cupo es exactamente 1', () => {
            expect(() => validator.validateCapacity(1)).not.toThrow();
        });

        it('debe lanzar error si el cupo es cero', () => {
            expect(() => validator.validateCapacity(0)).toThrow('El cupo debe ser mayor a cero');
        });

        it('debe lanzar error si el cupo es negativo', () => {
            expect(() => validator.validateCapacity(-5)).toThrow('El cupo debe ser mayor a cero');
        });
    });

    describe('validatePrice', () => {
        it('debe pasar si el precio es cero', () => {
            expect(() => validator.validatePrice(0)).not.toThrow();
        });

        it('debe pasar si el precio es mayor a cero (ej: 1500)', () => {
            expect(() => validator.validatePrice(1500)).not.toThrow();
        });

        it('debe lanzar error si el precio es negativo', () => {
            expect(() => validator.validatePrice(-100)).toThrow('El precio no puede ser negativo');
        });
    });

    describe('validateNameIsUnique', () => {
        describe('cuando el nombre del deporte no existe', () => {
            beforeEach(async () => {
                vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
            });

            it('no debe lanzar ningún error al validar', async () => {
                await expect(validator.validateNameIsUnique('Futbol')).resolves.not.toThrow();
            });

            it('debe llamar al repositorio para buscar por el nombre indicado', async () => {
                // Ejecutamos nuevamente la validación para verificar el mock
                // (Nota: el beforeEach limpia los mocks, así que re-configuramos solo para esta prueba)
                vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
                await validator.validateNameIsUnique('Futbol');
                expect(mockSportRepo.findByName).toHaveBeenCalledWith('Futbol');
            });
        });

        describe('cuando el nombre del deporte ya existe', () => {
            beforeEach(() => {
                vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({ id: '1', name: 'Futbol' } as any);
            });

            it('debe lanzar error indicando que ya existe', async () => {
                await expect(validator.validateNameIsUnique('Futbol')).rejects.toThrow('Ya existe un deporte con ese nombre');
            });
        });
    });
});
