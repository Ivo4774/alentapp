import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

export class CreateMedicalCertificateUseCase {
  constructor(
    private readonly repository: MedicalCertificateRepository,
    private readonly validator: MedicalCertificateValidator
  ) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    // 1. Validaciones de carga de datos, formatos y strings vacíos
    this.validator.validateInputData(data);

    // 2. Validar coherencia lógica interna de las fechas
    const issueDate = new Date(data.issue_date);
    const expiryDate = new Date(data.expiry_date);
    this.validator.validateChronologicalDates(issueDate, expiryDate);

    // 3. Validar de forma asrincrónica que el socio realmente exista en el sistema
    await this.validator.validateMemberExists(data.member_id);

    // 4. TDD-0007: Buscar certificados previos del socio para invalidarlos
    const previousCertificates = await this.repository.findByMemberId(data.member_id);
    
    for (const cert of previousCertificates) {
      if (cert.is_validated) {
        await this.repository.update(cert.id, { is_validated: false });
      }
    }

    // 5. Crear el nuevo certificado
    return await this.repository.create({
      ...data,
      is_validated: true
    });
  }
}