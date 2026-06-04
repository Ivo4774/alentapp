import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../../domain/SportRepository.js';

describe('DeleteSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as SportRepository;

    const useCase = new DeleteSportUseCase(mockSportRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('cuando el deporte no existe', () => {
        beforeEach(() => {
            vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);
        });

        it('debe lanzar error', async () => {
            await expect(useCase.execute('uuid-999')).rejects.toThrow('El deporte no existe');
        });

        it('no debe llamar al método delete del repositorio', async () => {
            // Suprimimos el error aquí capturándolo para verificar el estado del mock tranquilamente
            try { await useCase.execute('uuid-999'); } catch (e) {}
            expect(mockSportRepo.delete).not.toHaveBeenCalled();
        });
    });

    describe('cuando el deporte existe', () => {
        beforeEach(async () => {
            vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({ id: 'uuid-1' } as any);
            await useCase.execute('uuid-1');
        });

        it('debe llamar al método delete del repositorio con el ID', () => {
            expect(mockSportRepo.delete).toHaveBeenCalledWith('uuid-1');
        });
    });
});
