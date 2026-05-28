import { MedicalCertificateRepository } from '../MedicalCertificateRepository.js';
import { MemberRepository } from '../MemberRepository.js';

// Expresión regular para validar formato UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Expresión regular para validar formato YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class MedicalCertificateValidator {
    constructor(
        private readonly certificateRepo: MedicalCertificateRepository,
        private readonly memberRepo: MemberRepository
    ) {}


    validateInputData(data: {
        issue_date: string;
        expiry_date: string;
        doctor_license: string;
        member_id: string;
    }): void {
        // 1. Validar strings vacíos o compuestos solo por espacios
        if (!data.doctor_license || data.doctor_license.trim() === '') {
            throw new Error("La matrícula del médico es obligatoria");
        }
        if (!data.member_id || data.member_id.trim() === '') {
            throw new Error("El ID del socio es obligatorio");
        }

        // 2. Validar formato de ID (UUID v4)
        if (!UUID_REGEX.test(data.member_id)) {
            throw new Error("El ID del socio no tiene un formato válido");
        }

        // 3. Validar valores negativos o no numéricos en la matrícula
        if (data.doctor_license.trim().startsWith('-') || parseInt(data.doctor_license) <= 0 || isNaN(Number(data.doctor_license))) {
            throw new Error("La matrícula del médico no puede ser un valor negativo o cero");
        }

        // 4. Validar formato de strings de fecha
        if (!DATE_REGEX.test(data.issue_date) || !DATE_REGEX.test(data.expiry_date)) {
            throw new Error("Formato de fecha debe ser YYYY-MM-DD");
        }
    }


    validateChronologicalDates(issueDate: Date, expiryDate: Date): void {
        // Vencimiento menor o igual a emisión
        if (expiryDate <= issueDate) {
            throw new Error("La fecha de vencimiento es inválida");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Certificado que ya expiró respecto al día de hoy
        if (expiryDate < today) {
            throw new Error("No se puede cargar un certificado vencido");
        }
    }

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        if (!member) {
            throw new Error("Socio no encontrado");
        }
    }

    validateIdFormat(id: string): void {
        if (!id || !UUID_REGEX.test(id)) {
            throw new Error("El ID proporcionado no tiene un formato válido");
        }
    }

    validateDoctorLicense(doctorLicense: string): void {
        if (!doctorLicense || doctorLicense.trim() === '') {
            throw new Error("La matrícula del médico no puede estar vacía");
        }
        if (doctorLicense.trim().startsWith('-') || parseInt(doctorLicense) <= 0 || isNaN(Number(doctorLicense))) {
            throw new Error("La matrícula del médico no puede ser un valor negativo o cero");
        }
    }
}