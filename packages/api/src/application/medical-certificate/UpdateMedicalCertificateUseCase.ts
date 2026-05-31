import { UpdateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

export class UpdateMedicalCertificateUseCase {
  constructor(
    private readonly repository: MedicalCertificateRepository,
    private readonly validator: MedicalCertificateValidator
  ) {}

  async execute(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    // 1. Validar formato del ID que viene por parámetro
    this.validator.validateIdFormat(id);

    // 2. Validar si el certificado realmente existe en el sistema
    const existingCert = await this.repository.findById(id);
    if (!existingCert) {
      throw new Error("Certificado no encontrado");
    }

    // --- NUEVO CHEQUEO DEL BACKEND ---
    // 3. Si el usuario intenta editar la matrícula, la validamos antes de avanzar
    if (data.doctor_license !== undefined) {
        this.validator.validateDoctorLicense(data.doctor_license);
    }
    // ---------------------------------

    // 4. Validar fechas combinando lo que ya había con los nuevos datos del PATCH usando el validador
    const issueDate = data.issue_date ? new Date(data.issue_date) : new Date(existingCert.issue_date);
    const expiryDate = data.expiry_date ? new Date(data.expiry_date) : new Date(existingCert.expiry_date);
    
    this.validator.validateChronologicalDates(issueDate, expiryDate);

    // 5. TDD-0008: Si se marca como validado, desactivar de forma automática los otros del socio
    if (data.is_validated === true) {
      const previousCertificates = await this.repository.findByMemberId(existingCert.member_id);
      
      for (const cert of previousCertificates) {
        if (cert.id !== id && cert.is_validated) {
          await this.repository.update(cert.id, { is_validated: false });
        }
      }
    }

    // 6. Persistir los cambios en la base de datos
    return await this.repository.update(id, data);
  }
}