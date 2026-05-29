import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './NewLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';

describe('CreateLockerUseCase - Alta de Casillero', () => {
    let lockerRepoMock: LockerRepository;
    let lockerValidatorMock: LockerValidator;
    let createLockerUseCase: CreateLockerUseCase;

    beforeEach(() => {
        vi.clearAllMocks();

        lockerRepoMock = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByMemberId: vi.fn(),
        } as unknown as LockerRepository;

        lockerValidatorMock = {
            validateNumberIsUnique: vi.fn(),
        } as unknown as LockerValidator;

        createLockerUseCase = new CreateLockerUseCase(lockerRepoMock, lockerValidatorMock);
    });

    it('debe crear un casillero exitosamente si los datos son correctos', async () => {
        const payload = { number: 10, location: 'Pasillo Principal' };
        const createdLocker = { id: 'uuid-1', ...payload, status: 'Available', member_id: null, created_at: 'hoy', updated_at: 'hoy' };
        
        vi.mocked(lockerValidatorMock.validateNumberIsUnique).mockResolvedValue();
        vi.mocked(lockerRepoMock.create).mockResolvedValue(createdLocker as any);

        const result = await createLockerUseCase.execute(payload);

        expect(result).toEqual(createdLocker);
        expect(lockerValidatorMock.validateNumberIsUnique).toHaveBeenCalledWith(10);
        expect(lockerRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({
            number: 10,
            location: 'Pasillo Principal',
            status: 'Available',
            member_id: null
        }));
    });

    it('debe arrojar error si falta el número de casillero', async () => {
        const payload = { location: 'Pasillo Principal' } as any;

        await expect(createLockerUseCase.execute(payload))
            .rejects
            .toThrow('El número y la ubicación son obligatorios');
        
        expect(lockerRepoMock.create).not.toHaveBeenCalled();
    });

    it('debe arrojar error si falta la ubicación', async () => {
        const payload = { number: 10, location: '' } as any;

        await expect(createLockerUseCase.execute(payload))
            .rejects
            .toThrow('El número y la ubicación son obligatorios');
        
        expect(lockerRepoMock.create).not.toHaveBeenCalled();
    });

    it('debe frenar la creación si el validador detecta número duplicado', async () => {
        const payload = { number: 15, location: 'Vestuario' };
        
        vi.mocked(lockerValidatorMock.validateNumberIsUnique)
            .mockRejectedValue(new Error('El número de casillero ya se encuentra registrado'));

        await expect(createLockerUseCase.execute(payload))
            .rejects
            .toThrow('El número de casillero ya se encuentra registrado');
            
        expect(lockerRepoMock.create).not.toHaveBeenCalled();
    });
});