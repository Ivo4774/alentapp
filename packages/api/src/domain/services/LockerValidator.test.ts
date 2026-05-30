import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerValidator } from './LockerValidator.js';
import { LockerRepository } from '../LockerRepository.js';

describe('LockerValidator - Alta de Casillero', () => {
    let lockerRepositoryMock: LockerRepository;
    let lockerValidator: LockerValidator;

    beforeEach(() => {
        lockerRepositoryMock = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByMemberId: vi.fn(),
        } as unknown as LockerRepository;

        lockerValidator = new LockerValidator(lockerRepositoryMock);
    });

    it('debe validar exitosamente si el número de casillero es único (no existe en BD)', async () => {
        vi.mocked(lockerRepositoryMock.findByNumber).mockResolvedValue(null);
        await expect(lockerValidator.validateNumberIsUnique(15)).resolves.toBeUndefined();
        expect(lockerRepositoryMock.findByNumber).toHaveBeenCalledWith(15);
        expect(lockerRepositoryMock.findByNumber).toHaveBeenCalledTimes(1);
    });

    it('debe arrojar error de negocio si el número de casillero ya se encuentra registrado', async () => {
        vi.mocked(lockerRepositoryMock.findByNumber).mockResolvedValue({
            id: 'uuid-existente',
            number: 15,
            location: 'vestuario 1',
            status: 'Available',
            member_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        await expect(lockerValidator.validateNumberIsUnique(15))
            .rejects
            .toThrow('El número de casillero ya se encuentra registrado');
            
        expect(lockerRepositoryMock.findByNumber).toHaveBeenCalledWith(15);
    });
});