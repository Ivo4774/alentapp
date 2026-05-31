import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CreateMedicalCertificateUseCase } from './CreateMedicalCertificateUseCase.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

describe('CreateMedicalCertificateUseCase - Tests Unitarios (Alta)', () => {
    let useCase: CreateMedicalCertificateUseCase;
    let validator: MedicalCertificateValidator;
    
    // Mocks de los repositorios
    const mockCertificateRepo = {
        create: vi.fn(),
        findById: vi.fn(),
        findByMemberId: vi.fn(),
        findAll: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        validator = new MedicalCertificateValidator(mockCertificateRepo, mockMemberRepo);
        useCase = new CreateMedicalCertificateUseCase(mockCertificateRepo, validator);
    });

    // 1. CASO FELIZ + REGLA DE NEGOCIO TDD-0007
    test('1. Debe crear un certificado exitosamente e invalidar los certificados activos previos del socio', async () => {
        const validRequest: CreateMedicalCertificateRequest = {
            issue_date: '2026-05-01',
            expiry_date: '2026-12-31', // Fecha futura coherente
            doctor_license: '123456',
            member_id: '88888888-4444-4444-8888-121212121212', // UUID válido
        };

        // Simulamos que el socio existe
        vi.mocked(mockMemberRepo.findById).mockResolvedValue({ id: validRequest.member_id } as any);
        
        // Simulamos que tenía un certificado viejo activo (TDD-0007)
        const mockOldCert = { id: 'cert-viejo-123', is_validated: true };
        vi.mocked(mockCertificateRepo.findByMemberId).mockResolvedValue([mockOldCert] as any);
        
        vi.mocked(mockCertificateRepo.create).mockResolvedValue({ id: 'new-cert-id', ...validRequest, is_validated: true } as any);

        const result = await useCase.execute(validRequest);

        expect(result).toBeDefined();
        expect(result.is_validated).toBe(true);
        // Verificamos que se haya llamado al update para desactivar el viejo
        expect(mockCertificateRepo.update).toHaveBeenCalledWith('cert-viejo-123', { is_validated: false });
        expect(mockCertificateRepo.create).toHaveBeenCalled();
    });

    // 2. EXCEPCIÓN: FECHAS INCOHERENTES
    test('2. Debe lanzar un error si la fecha de vencimiento es menor o igual a la de emisión', async () => {
        const invalidRequest: CreateMedicalCertificateRequest = {
            issue_date: '2026-05-10',
            expiry_date: '2026-05-05', // Vencimiento menor a emisión
            doctor_license: '123456',
            member_id: '88888888-4444-4444-8888-121212121212',
        };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow("La fecha de vencimiento es inválida");
        expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });

    // 3. EXCEPCIÓN: CERTIFICADO YA VENCIDO HOY
    test('3. Debe lanzar un error si la fecha de vencimiento ya pasó respecto al día de hoy', async () => {
        const invalidRequest: CreateMedicalCertificateRequest = {
            issue_date: '2025-01-01',
            expiry_date: '2025-02-01', // Ya vencido en 2026
            doctor_license: '123456',
            member_id: '88888888-4444-4444-8888-121212121212',
        };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow("No se puede cargar un certificado vencido");
    });

    // 4. EXCEPCIÓN: MATRÍCULA VACÍA O ESPACIOS
    test('4. Debe lanzar un error si la matrícula del médico viene vacía o con puros espacios', async () => {
        const invalidRequest: CreateMedicalCertificateRequest = {
            issue_date: '2026-05-01',
            expiry_date: '2026-12-31',
            doctor_license: '   ', // Espacios en blanco maliciosos
            member_id: '88888888-4444-4444-8888-121212121212',
        };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow("La matrícula del médico es obligatoria");
    });

    // 5. EXCEPCIÓN: MATRÍCULA NEGATIVA O INVÁLIDA
    test('5. Debe lanzar un error si la matrícula del médico es un valor negativo o cero', async () => {
        const invalidRequest: CreateMedicalCertificateRequest = {
            issue_date: '2026-05-01',
            expiry_date: '2026-12-31',
            doctor_license: '-4567', // Matrícula negativa por bypass
            member_id: '88888888-4444-4444-8888-121212121212',
        };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow("La matrícula del médico no puede ser un valor negativo o cero");
    });

    // 6. EXCEPCIÓN: FORMATO DE SOCIO (UUID) INVÁLIDO
    test('6. Debe lanzar un error si el ID del socio no cumple con el formato UUID válido', async () => {
        const invalidRequest: CreateMedicalCertificateRequest = {
            issue_date: '2026-05-01',
            expiry_date: '2026-12-31',
            doctor_license: '123456',
            member_id: 'id-invalido-123', // Estructura rota
        };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow("El ID del socio no tiene un formato válido");
    });
});