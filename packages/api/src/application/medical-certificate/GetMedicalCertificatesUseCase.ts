import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class GetMedicalCertificatesUseCase {
  constructor(private readonly repository: MedicalCertificateRepository) {}

  async execute(memberId?: string): Promise<MedicalCertificateDTO[]> {
    if (memberId) {
      return await this.repository.findByMemberId(memberId);
    }
    
    return await this.repository.findAll();
  }
}