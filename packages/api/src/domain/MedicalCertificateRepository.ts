import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
  create(data: Omit<MedicalCertificateDTO, 'id'>): Promise<MedicalCertificateDTO>;
  findById(id: string): Promise<MedicalCertificateDTO | null>;
  findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
  findAll(): Promise<MedicalCertificateDTO[]>;
  update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
  delete(id: string): Promise<void>;
}