import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js'; 
import { LockerRepository } from '../../domain/LockerRepository.js';
import { LockerValidator } from '../../domain/services/LockerValidator.js';

describe('UpdateLockerUseCase - Modificación de Casillero', () => {
    let lockerRepoMock: LockerRepository;
    let lockerValidatorMock: LockerValidator;
    let updateLockerUseCase: UpdateLockerUseCase;

    beforeEach(() => {
        vi.clearAllMocks();

        // Armamos un doble de prueba (mock) del repositorio
        lockerRepoMock = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByMemberId: vi.fn(),
        } as unknown as LockerRepository;

        // Armamos un doble de prueba del validador de dominio
        lockerValidatorMock = {
            validateNumberIsUnique: vi.fn(),
        } as unknown as LockerValidator;

        updateLockerUseCase = new UpdateLockerUseCase(lockerRepoMock, lockerValidatorMock);
    });

    it('debe actualizar el casillero exitosamente cambiando su ubicación y estado', async () => {
        const existingLocker = { id: 'uuid-1', number: 10, location: 'Vestuario A', status: 'Available' };
        const payload = { location: 'Vestuario B', status: 'Maintenance' };
        
        // Simulamos que el casillero existe en la BD
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(existingLocker as any);
        // Simulamos que el update devuelve el objeto combinado
        vi.mocked(lockerRepoMock.update).mockResolvedValue({ ...existingLocker, ...payload } as any);

        const result = await updateLockerUseCase.execute('uuid-1', payload);

        expect(result.location).toBe('Vestuario B');
        expect(result.status).toBe('Maintenance');
        expect(lockerRepoMock.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining(payload));
    });

    it('debe arrojar un error si se intenta modificar un casillero inexistente', async () => {
        // Simulamos que la BD no encuentra el casillero
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(null);

        await expect(updateLockerUseCase.execute('uuid-inexistente', { location: 'Nuevo' }))
            .rejects
            .toThrow('El casillero no existe');
            
        // Verificamos que el proceso se frenó y nunca llamó al update real
        expect(lockerRepoMock.update).not.toHaveBeenCalled();
    });

    it('debe frenar la actualización si se intenta cambiar a un número que ya está registrado', async () => {
        const existingLocker = { id: 'uuid-1', number: 10, location: 'Vestuario A' };
        
        vi.mocked(lockerRepoMock.findById).mockResolvedValue(existingLocker as any);
        // Simulamos que el validador detecta que el nuevo número ya está usado
        vi.mocked(lockerValidatorMock.validateNumberIsUnique)
            .mockRejectedValue(new Error('El número de casillero ya se encuentra registrado'));

        await expect(updateLockerUseCase.execute('uuid-1', { number: 15 }))
            .rejects
            .toThrow('El número de casillero ya se encuentra registrado');
            
        expect(lockerRepoMock.update).not.toHaveBeenCalled();
    });
});