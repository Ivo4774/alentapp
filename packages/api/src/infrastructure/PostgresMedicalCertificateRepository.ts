import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBMedicalCertificate = {
    id: string;
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    is_validated: boolean;
    member_id: string;
    file_data?: string | null;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {
    async create(data: Omit<MedicalCertificateDTO, 'id'>): Promise<MedicalCertificateDTO> {
        const cert = await prisma.medicalCertificate.create({
            data: {
                issue_date: new Date(data.issue_date),
                expiry_date: new Date(data.expiry_date),
                doctor_license: data.doctor_license,
                is_validated: data.is_validated,
                member_id: data.member_id,
                file_data: (data as any).file_data || null,
            },
        });

        return this.mapToDTO(cert);
    }

    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const cert = await prisma.medicalCertificate.findUnique({
            where: { id },
        });

        return cert ? this.mapToDTO(cert) : null;
    }

    async findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certs = await prisma.prismaPg ? await prisma.medicalCertificate.findMany({
            where: { member_id: memberId },
            orderBy: { expiry_date: 'desc' },
        }) : await prisma.medicalCertificate.findMany({
            where: { member_id: memberId },
            orderBy: { expiry_date: 'desc' },
        });

        return certs.map((cert) => this.mapToDTO(cert));
    }

    async findAll(): Promise<MedicalCertificateDTO[]> {
        const certs = await prisma.medicalCertificate.findMany({
            orderBy: { created_at: 'desc' }
        });
        return certs.map((cert) => this.mapToDTO(cert));
    }

    async update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        const cert = await prisma.medicalCertificate.update({
            where: { id },
            data: {
                ...(data.issue_date && { issue_date: new Date(data.issue_date) }),
                ...(data.expiry_date && { expiry_date: new Date(data.expiry_date) }),
                ...(data.doctor_license && { doctor_license: data.doctor_license }),
                ...(data.is_validated !== undefined && { is_validated: data.is_validated }),
                ...(((data as any).file_data !== undefined) && { file_data: (data as any).file_data }),
            },
        });

        return this.mapToDTO(cert);
    }

    async delete(id: string): Promise<void> {
        await prisma.medicalCertificate.delete({
            where: { id },
        });
    }

    private mapToDTO(cert: DBMedicalCertificate): MedicalCertificateDTO {
        return {
            id: cert.id,
            issue_date: cert.issue_date ? cert.issue_date.toISOString().split('T')[0] : '',
            expiry_date: cert.expiry_date ? cert.expiry_date.toISOString().split('T')[0] : '',
            doctor_license: cert.doctor_license,
            is_validated: cert.is_validated,
            member_id: cert.member_id,
            ...((cert.file_data !== undefined) && { file_data: cert.file_data }),
        } as MedicalCertificateDTO;
    }
}