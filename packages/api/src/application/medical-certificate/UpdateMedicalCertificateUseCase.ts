import { UpdateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class UpdateMedicalCertificateUseCase {
  constructor(private readonly repository: MedicalCertificateRepository) {}

  async execute(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    // 1. Validar si el certificado realmente existe en el sistema
    const existingCert = await this.repository.findById(id);
    if (!existingCert) {
      throw new Error("Certificado no encontrado");
    }

    // 2. Validar fechas combinando lo que ya había con los nuevos datos del PATCH
    const issueDate = data.issue_date ? new Date(data.issue_date) : new Date(existingCert.issue_date);
    const expiryDate = data.expiry_date ? new Date(data.expiry_date) : new Date(existingCert.expiry_date);

    if (expiryDate <= issueDate) {
      throw new Error("La fecha de vencimiento debe ser posterior a la de emisión");
    }

    // 3. TDD-0008: Si se marca como validado, desactivar de forma automática los otros del socio
    if (data.is_validated === true) {
      const previousCertificates = await this.repository.findByMemberId(existingCert.member_id);
      
      for (const cert of previousCertificates) {
        if (cert.id !== id && cert.is_validated) {
          await this.repository.update(cert.id, { is_validated: false });
        }
      }
    }

    // 4. Persistir los cambios en la base de datos
    return await this.repository.update(id, data);
  }
}