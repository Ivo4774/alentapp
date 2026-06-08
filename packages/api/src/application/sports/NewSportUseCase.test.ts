import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './NewSportUseCase.js';
import { SportRepository } from '../../domain/SportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { SportDTO } from '@alentapp/shared';

describe('CreateSportUseCase', () => {
    const mockSportRepo = {
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateCapacity: vi.fn(),
        validatePrice: vi.fn(),
        validateNameIsUnique: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('cuando todas las validaciones son exitosas', () => {
        const inputData = {
            name: 'Futbol',
            description: 'Cancha 11',
            max_capacity: 22,
            additional_price: 0,
            requires_medical_certificate: true
        };

        const expectedSport: SportDTO = {
            ...inputData,
            id: '123',
            created_at: expect.any(String) // Es más seguro usar expect.any para fechas generadas dinámicamente
        };

        let result: SportDTO;

        beforeEach(async () => {
            vi.mocked(mockSportValidator.validateNameIsUnique).mockResolvedValueOnce();
            vi.mocked(mockSportRepo.create).mockResolvedValueOnce(expectedSport);
            result = await useCase.execute(inputData);
        });

        it('debe validar la capacidad', () => {
            expect(mockSportValidator.validateCapacity).toHaveBeenCalledWith(22);
        });

        it('debe validar el precio', () => {
            expect(mockSportValidator.validatePrice).toHaveBeenCalledWith(0);
        });

        it('debe validar que el nombre sea único', () => {
            expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith('Futbol');
        });

        it('debe persistir el deporte en el repositorio', () => {
            expect(mockSportRepo.create).toHaveBeenCalledWith(inputData);
        });

        it('debe retornar el deporte creado', () => {
            expect(result).toEqual(expectedSport);
        });
    });

    it('debe abortar la creacion si una validacion falla', async () => {
        const inputData = {
            name: 'Futbol',
            description: 'Cancha 11',
            max_capacity: -5,
            additional_price: 0,
            requires_medical_certificate: true
        };

        vi.mocked(mockSportValidator.validateCapacity).mockImplementation(() => {
            throw new Error('El cupo debe ser mayor a cero');
        });

        await expect(useCase.execute(inputData)).rejects.toThrow('El cupo debe ser mayor a cero');

        expect(mockSportValidator.validateCapacity).toHaveBeenCalledWith(-5);
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });
});
