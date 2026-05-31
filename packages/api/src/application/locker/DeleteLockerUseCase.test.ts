import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js'; 
import { LockerRepository } from '../../domain/LockerRepository.js';

describe('DeleteLockerUseCase - Eliminación de Casillero', () => {
    let lockerRepoMock: LockerRepository;
    let deleteLockerUseCase: DeleteLockerUseCase;

    beforeEach(() => {
        vi.clearAllMocks();

        // Armamos el mock del repositorio
        lockerRepoMock = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByMemberId: vi.fn(),
        } as unknown as LockerRepository;

        deleteLockerUseCase = new DeleteLockerUseCase(lockerRepoMock);
    });

    it('debe eliminar el casillero exitosamente si existe y no está asignado', async () => {
        const existingLocker = { id: 'uuid-1', number: 10, status: 'Available' };
        
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(existingLocker as any);
        vi.mocked(lockerRepoMock.delete).mockResolvedValue(undefined); // El borrado no suele devolver nada

        await expect(deleteLockerUseCase.execute('uuid-1')).resolves.not.toThrow();
        
        expect(lockerRepoMock.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('debe arrojar un error de no existencia si el casillero no se encuentra en el sistema', async () => {
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(null);

        await expect(deleteLockerUseCase.execute('uuid-inexistente'))
            .rejects
            .toThrow('El casillero no existe');
            
        expect(lockerRepoMock.delete).not.toHaveBeenCalled();
    });

    it('debe impedir la eliminación si el casillero se encuentra asignado a un socio', async () => {
        // Simulamos que el casillero existe pero su estado es 'Occupied' o tiene un socio asignado
        const assignedLocker = { id: 'uuid-1', number: 10, status: 'Occupied', memberId: 'socio-123' };
        
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(assignedLocker as any);

        await expect(deleteLockerUseCase.execute('uuid-1'))
            .rejects
            .toThrow('No se puede eliminar un casillero asignado');
            
        expect(lockerRepoMock.delete).not.toHaveBeenCalled();
    });
});