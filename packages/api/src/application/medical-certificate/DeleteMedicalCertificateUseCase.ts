import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

export class DeleteMedicalCertificateUseCase {
  constructor(
    private readonly repository: MedicalCertificateRepository,
    private readonly validator: MedicalCertificateValidator
  ) {}

  async execute(id: string): Promise<void> {
    // 1. Validar formato del ID antes de operar
    this.validator.validateIdFormat(id);

    // 2. Validar que el certificado exista antes de intentar eliminarlo
    const existingCert = await this.repository.findById(id);
    if (!existingCert) {
      throw new Error("Certificado no encontrado");
    }

    // 3. TDD-0009: Realizar el borrado físico (hard delete)
    await this.repository.delete(id);
  }
}