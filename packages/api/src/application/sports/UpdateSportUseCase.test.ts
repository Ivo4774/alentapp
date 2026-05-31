import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportValidator } from '../../domain/services/SportValidator.js';

describe('UpdateSportUseCase - Unit Tests', () => {
    const mockRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByName: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    };

    const validator = new SportValidator(mockRepo as any);
    const updateSportUseCase = new UpdateSportUseCase(mockRepo as any, validator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error 404 si el ID no existe', async () => {
        mockRepo.findById.mockResolvedValueOnce(null);

        await expect(updateSportUseCase.execute('999', { description: 'Nueva' }))
            .rejects
            .toThrow('El deporte no existe');
    });

    it('debe lanzar error si se intenta modificar el nombre del deporte', async () => {
        mockRepo.findById.mockResolvedValueOnce({ id: '1', name: 'Original', description: 'Vieja', max_capacity: 10 });

        await expect(updateSportUseCase.execute('1', { name: 'Cambiado' }))
            .rejects
            .toThrow('El nombre del deporte es inmutable');
    });

    it('debe lanzar error si se intenta actualizar a una capacidad negativa', async () => {
        mockRepo.findById.mockResolvedValueOnce({ id: '1', name: 'Original', description: 'Vieja', max_capacity: 10 });

        await expect(updateSportUseCase.execute('1', { max_capacity: -5 }))
            .rejects
            .toThrow('La nueva capacidad debe ser mayor a cero');
    });

    it('debe llamar al repositorio con los datos limpios si el payload es valido', async () => {
        mockRepo.findById.mockResolvedValueOnce({ id: '1', name: 'Original', description: 'Vieja', max_capacity: 10 });
        mockRepo.update.mockResolvedValueOnce({ id: '1', name: 'Original', description: 'Nueva description', max_capacity: 25 });

        const result = await updateSportUseCase.execute('1', { description: 'Nueva description', max_capacity: 25 });

        expect(mockRepo.update).toHaveBeenCalledWith('1', { description: 'Nueva description', max_capacity: 25 });
        expect(result.description).toBe('Nueva description');
        expect(result.max_capacity).toBe(25);
    });
});
