import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class DeleteMedicalCertificateUseCase {
  constructor(private readonly repository: MedicalCertificateRepository) {}

  async execute(id: string): Promise<void> {
    // 1. Validar que el certificado exista antes de intentar eliminarlo
    const existingCert = await this.repository.findById(id);
    if (!existingCert) {
      throw new Error("Certificado no encontrado");
    }

    // 2. TDD-0009: Realizar el borrado físico (hard delete)
    await this.repository.delete(id);
  }
}