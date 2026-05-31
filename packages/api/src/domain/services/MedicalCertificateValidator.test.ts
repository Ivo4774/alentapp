import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificateValidator } from './MedicalCertificateValidator.js';
import { MedicalCertificateRepository } from '../MedicalCertificateRepository.js';
import { MemberRepository } from '../MemberRepository.js';

describe('MedicalCertificateValidator', () => {
    const mockCertificateRepo = {} as unknown as MedicalCertificateRepository;
    
    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new MedicalCertificateValidator(mockCertificateRepo, mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    describe('validateInputData', () => {
        const VALID_UUID = '88888888-4444-4444-8888-121212121212';

        it('debe pasar correctamente si todos los datos estructurales son válidos', () => {
            const validPayload = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: VALID_UUID
            };
            expect(() => validator.validateInputData(validPayload)).not.toThrow();
        });

        it('debe lanzar un error si la matrícula del médico está vacía o compuesta solo por espacios', () => {
            const payloadIncompleto = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '   ',
                member_id: VALID_UUID
            };
            expect(() => validator.validateInputData(payloadIncompleto))
                .toThrow('La matrícula del médico es obligatoria');
        });

        it('debe lanzar un error si el ID del socio está vacío', () => {
            const payloadIncompleto = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: ''
            };
            expect(() => validator.validateInputData(payloadIncompleto))
                .toThrow('El ID del socio es obligatorio');
        });

        it('debe lanzar un error si el ID del socio no cumple con el formato regex de un UUID v4 legítimo', () => {
            const payloadIdInvalido = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: 'socio-no-uuid-123'
            };
            expect(() => validator.validateInputData(payloadIdInvalido))
                .toThrow('El ID del socio no tiene un formato válido');
        });

        it('debe lanzar un error si la matrícula contiene valores negativos, es cero o no es numérica', () => {
            const payloadMatriculaNegativa = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '-12345',
                member_id: VALID_UUID
            };
            const payloadMatriculaLetras = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: 'MN1234',
                member_id: VALID_UUID
            };
            expect(() => validator.validateInputData(payloadMatriculaNegativa))
                .toThrow('La matrícula del médico no puede ser un valor negativo o cero');
            expect(() => validator.validateInputData(payloadMatriculaLetras))
                .toThrow('La matrícula del médico no puede ser un valor negativo o cero');
        });

        it('debe lanzar un error si las fechas no respetan estrictamente el formato YYYY-MM-DD', () => {
            const payloadFechaInvalida = {
                issue_date: '01/05/2026', // Formato incorrecto
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: VALID_UUID
            };
            expect(() => validator.validateInputData(payloadFechaInvalida))
                .toThrow('Formato de fecha debe ser YYYY-MM-DD');
        });
    });

    describe('validateChronologicalDates', () => {
        it('debe pasar correctamente si las fechas son coherentes y a futuro', () => {
            const today = new Date();
            const issueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const expiryDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()); // 1 año a futuro

            expect(() => validator.validateChronologicalDates(issueDate, expiryDate)).not.toThrow();
        });

        it('debe lanzar un error si la fecha de vencimiento es menor o igual a la de emisión', () => {
            const today = new Date();
            const issueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const expiryDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2); // 2 días antes de emitir

            expect(() => validator.validateChronologicalDates(issueDate, expiryDate))
                .toThrow('La fecha de vencimiento es inválida');
        });

        it('debe lanzar un error si el certificado ya se encuentra expirado respecto al día de hoy', () => {
            const today = new Date();
            // Emitido el año pasado y vencido hace 6 meses
            const issueDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            const expiryDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());

            expect(() => validator.validateChronologicalDates(issueDate, expiryDate))
                .toThrow('No se puede cargar un certificado vencido');
        });
    });

    describe('validateMemberExists', () => {
        const sampleId = '88888888-4444-4444-8888-121212121212';

        it('debe resolver de forma exitosa si el socio existe en la base de datos', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: sampleId, name: 'Socio Activo' } as any);

            await expect(validator.validateMemberExists(sampleId)).resolves.not.toThrow();
            expect(mockMemberRepo.findById).toHaveBeenCalledWith(sampleId);
        });

        it('debe rechazar con una excepción controlada si el repositorio no encuentra al socio', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

            await expect(validator.validateMemberExists(sampleId)).rejects.toThrow('Socio no encontrado');
        });
    });

    describe('validateIdFormat', () => {
        it('debe pasar si el ID suministrado es un formato UUID v4 válido', () => {
            const validUuid = '77777777-7777-4777-b777-777777777777';
            expect(() => validator.validateIdFormat(validUuid)).not.toThrow();
        });

        it('debe lanzar un error si el ID está vacío o no cumple con la estructura UUID v4', () => {
            expect(() => validator.validateIdFormat('')).toThrow('El ID proporcionado no tiene un formato válido');
            expect(() => validator.validateIdFormat('123-id-erroneo')).toThrow('El ID proporcionado no tiene un formato válido');
        });
    });

    describe('validateDoctorLicense', () => {
        it('debe pasar correctamente si la matrícula es un string numérico positivo', () => {
            expect(() => validator.validateDoctorLicense('99999')).not.toThrow();
        });

        it('debe lanzar un error si la matrícula está vacía o compuesta por puros espacios', () => {
            expect(() => validator.validateDoctorLicense('   '))
                .toThrow('La matrícula del médico no puede estar vacía');
        });

        it('debe lanzar un error si la matrícula es igual o menor a cero, o contiene letras', () => {
            expect(() => validator.validateDoctorLicense('0'))
                .toThrow('La matrícula del médico no puede ser un valor negativo o cero');
            expect(() => validator.validateDoctorLicense('-456'))
                .toThrow('La matrícula del médico no puede ser un valor negativo o cero');
            expect(() => validator.validateDoctorLicense('abc12'))
                .toThrow('La matrícula del médico no puede ser un valor negativo o cero');
        });
    });
});