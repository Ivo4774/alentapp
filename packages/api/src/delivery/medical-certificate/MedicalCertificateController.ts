import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../../application/medical-certificate/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../../application/medical-certificate/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../../application/medical-certificate/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../../application/medical-certificate/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly getUseCase: GetMedicalCertificatesUseCase,
        private readonly updateUseCase: UpdateMedicalCertificateUseCase,
        private readonly deleteUseCase: DeleteMedicalCertificateUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const certs = await this.getUseCase.execute();
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error interno del servidor" });
        }
    }

    async getByMember(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        try {
            const { memberId } = request.params;
            const certs = await this.getUseCase.execute(memberId);
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            if (error.message.includes('formato válido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno del servidor" });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMedicalCertificateRequest & { file_data?: string | null } }>,
        reply: FastifyReply,
    ) {
        try {
            const cert = await this.createUseCase.execute(request.body);
            return reply.status(201).send({ data: cert });
        } catch (error: any) {
            if (
                error.message.includes('obligatoria') || 
                error.message.includes('formato válido') || 
                error.message.includes('negativo o cero') || 
                error.message.includes('YYYY-MM-DD') || 
                error.message.includes('inválida') || 
                error.message.includes('vencido')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Socio no encontrado") {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno del servidor" });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest & { file_data?: string | null } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const cert = await this.updateUseCase.execute(id, request.body);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            if (error.message.includes('formato válido') || error.message.includes('posterior a la de emisión')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Certificado no encontrado") {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, por favor intente más tarde" });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('formato válido')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Certificado no encontrado") {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno del servidor, intente más tarde" });
        }
    }
}