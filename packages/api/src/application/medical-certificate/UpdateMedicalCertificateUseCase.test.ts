import { describe, test, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { UpdateMedicalCertificateRequest } from '@alentapp/shared';

describe('UpdateMedicalCertificateUseCase - Tests Unitarios (Modificación)', () => {
    let useCase: UpdateMedicalCertificateUseCase;
    let validator: MedicalCertificateValidator;

    const mockCertificateRepo = {
        findById: vi.fn(),
        findByMemberId: vi.fn(),
        update: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockValidator = {
        validateIdFormat: vi.fn(),
        validateDoctorLicense: vi.fn(),
        validateChronologicalDates: vi.fn(),
    } as unknown as MedicalCertificateValidator;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new UpdateMedicalCertificateUseCase(mockCertificateRepo, mockValidator);
    });

    // 1. CASO FELIZ + REGLA DE NEGOCIO TDD-0008
    test('1. Debe actualizar parcialmente el certificado y desactivar los otros activos si se marca como validado', async () => {
        const certId = 'id-certificado-123';
        const patchRequest: UpdateMedicalCertificateRequest = {
            is_validated: true,
            doctor_license: 'MN 99999'
        };

        const existingCert = {
            id: certId,
            member_id: 'socio-uuid-444',
            issue_date: '2026-01-01',
            expiry_date: '2026-06-01',
            doctor_license: '123456',
            is_validated: false
        };

        const mockPreviousCerts = [
            { id: 'id-certificado-viejo-1', member_id: 'socio-uuid-444', is_validated: true },
            { id: certId, member_id: 'socio-uuid-444', is_validated: false }
        ];

        vi.mocked(mockCertificateRepo.findById).mockResolvedValue(existingCert as any);
        vi.mocked(mockCertificateRepo.findByMemberId).mockResolvedValue(mockPreviousCerts as any);
        vi.mocked(mockCertificateRepo.update).mockResolvedValue({ ...existingCert, ...patchRequest } as any);

        const result = await useCase.execute(certId, patchRequest);

        expect(result).toBeDefined();
        expect(mockValidator.validateDoctorLicense).toHaveBeenCalledWith('MN 99999');
        expect(mockCertificateRepo.update).toHaveBeenCalledWith('id-certificado-viejo-1', { is_validated: false });
        expect(mockCertificateRepo.update).toHaveBeenCalledWith(certId, patchRequest);
    });

    // 2. EXCEPCIÓN: CERTIFICADO INEXISTENTE (HTTP 404)
    test('2. Debe lanzar un error específico si el certificado solicitado no existe en el sistema', async () => {
        const certId = 'id-inexistente';
        const patchRequest: UpdateMedicalCertificateRequest = { doctor_license: 'MN 888' };

        vi.mocked(mockCertificateRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(certId, patchRequest)).rejects.toThrow("Certificado no encontrado");
        expect(mockCertificateRepo.update).not.toHaveBeenCalled();
    });

    // 3. EXCEPCIÓN: VALIDACIÓN CRONOLÓGICA (HTTP 400)
    test('3. Debe delegar al validador y fallar si las fechas combinadas resultan cronológicamente inválidas', async () => {
        const certId = 'id-certificado-123';
        const patchRequest: UpdateMedicalCertificateRequest = { expiry_date: '2026-01-01' };

        const existingCert = {
            id: certId,
            member_id: 'socio-uuid-444',
            issue_date: '2026-05-01', 
            expiry_date: '2026-12-31',
            doctor_license: '123456',
            is_validated: true
        };

        vi.mocked(mockCertificateRepo.findById).mockResolvedValue(existingCert as any);
        vi.mocked(mockValidator.validateChronologicalDates).mockImplementation(() => {
            throw new Error("La fecha de vencimiento debe ser posterior a la de emisión");
        });

        await expect(useCase.execute(certId, patchRequest)).rejects.toThrow("La fecha de vencimiento debe ser posterior a la de emisión");
    });

    // 4. EXCEPCIÓN: NUEVO CHEQUEO - MATRÍCULA INVÁLIDA EN EL UPDATE (HTTP 400)
    test('4. Debe lanzar un error si el usuario intenta actualizar la matrícula con un formato prohibido o vacío', async () => {
        const certId = 'id-certificado-123';
        const patchRequest: UpdateMedicalCertificateRequest = { doctor_license: '-5555' }; // Matrícula inválida

        const existingCert = {
            id: certId,
            member_id: 'socio-uuid-444',
            issue_date: '2026-01-01',
            expiry_date: '2026-06-01',
            doctor_license: '123456',
            is_validated: true
        };

        vi.mocked(mockCertificateRepo.findById).mockResolvedValue(existingCert as any);
        // Simulamos el comportamiento del validador de matrículas arrojando la excepción de negocio
        vi.mocked(mockValidator.validateDoctorLicense).mockImplementation(() => {
            throw new Error("La matrícula del médico no puede ser un valor negativo o cero");
        });

        await expect(useCase.execute(certId, patchRequest)).rejects.toThrow("La matrícula del médico no puede ser un valor negativo o cero");
        expect(mockCertificateRepo.update).not.toHaveBeenCalled();
    });
});