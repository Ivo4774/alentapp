import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class CreateMedicalCertificateUseCase {
  constructor(private readonly repository: MedicalCertificateRepository) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    // Validar que la fecha de vencimiento sea posterior a la de emisión
    if (new Date(data.expiry_date) <= new Date(data.issue_date)) {
      throw new Error("La fecha de vencimiento debe ser posterior a la de emisión");
    }

    // TDD-0007: Buscar certificados previos del socio para invalidarlos
    const previousCertificates = await this.repository.findByMemberId(data.member_id);
    
    for (const cert of previousCertificates) {
      if (cert.is_validated) {

        await this.repository.update(cert.id, { is_validated: false });
      }
    }

    // Crear el nuevo certificado (por defecto is_validated será true según el esquema)
    return await this.repository.create({
      ...data,
      is_validated: true
    });
  }
}