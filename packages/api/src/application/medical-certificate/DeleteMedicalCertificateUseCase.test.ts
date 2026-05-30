import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DeleteMedicalCertificateUseCase } from './DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

describe('DeleteMedicalCertificateUseCase - Tests Unitarios (Baja Física)', () => {
    let useCase: DeleteMedicalCertificateUseCase;

    const mockCertificateRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockValidator = {
        validateIdFormat: vi.fn(),
    } as unknown as MedicalCertificateValidator;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new DeleteMedicalCertificateUseCase(mockCertificateRepo, mockValidator);
    });

    test('1. Debe ejecutar el borrado físico si el certificado existe y el ID es válido', async () => {
        const certId = '77777777-7777-4777-b777-777777777777';
        
        vi.mocked(mockCertificateRepo.findById).mockResolvedValue({ id: certId } as any);
        vi.mocked(mockCertificateRepo.delete).mockResolvedValue(undefined);

        await useCase.execute(certId);

        expect(mockValidator.validateIdFormat).toHaveBeenCalledWith(certId);
        expect(mockCertificateRepo.findById).toHaveBeenCalledWith(certId);
        expect(mockCertificateRepo.delete).toHaveBeenCalledWith(certId);
    });

    test('2. Debe lanzar una excepción si el certificado solicitado no existe en el sistema', async () => {
        const certId = 'uuid-inexistente';
        
        vi.mocked(mockCertificateRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(certId)).rejects.toThrow("Certificado no encontrado");
        expect(mockCertificateRepo.delete).not.toHaveBeenCalled();
    });

    test('3. Debe interrumpir la ejecución si el validador determina que el formato del ID es inválido', async () => {
        const certId = 'formato-invalido';
        
        vi.mocked(mockValidator.validateIdFormat).mockImplementation(() => {
            throw new Error("El ID proporcionado no tiene un formato válido");
        });

        await expect(useCase.execute(certId)).rejects.toThrow("El ID proporcionado no tiene un formato válido");
        expect(mockCertificateRepo.findById).not.toHaveBeenCalled();
        expect(mockCertificateRepo.delete).not.toHaveBeenCalled();
    });
});