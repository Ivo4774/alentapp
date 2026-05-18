import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/medical-certificate/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/medical-certificate/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/medical-certificate/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/medical-certificate/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

// Expresión regular para validar formato UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Expresión regular para validar formato YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
            if (!UUID_REGEX.test(memberId)) {
                return reply.status(400).send({ error: "El ID proporcionado no tiene un formato válido" });
            }
            const certs = await this.getUseCase.execute(memberId);
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error interno del servidor" });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMedicalCertificateRequest & { file_data?: string | null } }>,
        reply: FastifyReply,
    ) {
        try {
            const { issue_date, expiry_date, member_id } = request.body;

            // TDD_0007: Validar formato de fecha YYYY-MM-DD
            if (!DATE_REGEX.test(issue_date) || !DATE_REGEX.test(expiry_date)) {
                return reply.status(400).send({ error: "Formato de fecha debe ser YYYY-MM-DD" });
            }

            const issue = new Date(issue_date);
            const expiry = new Date(expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // TDD_0007: Validar fecha de vencimiento anterior a la de emisión
            if (expiry < issue) {
                return reply.status(400).send({ error: "La fecha de vencimiento es inválida" });
            }

            // TDD_0007: Validar certificado con fecha de vencimiento ya pasada
            if (expiry < today) {
                return reply.status(400).send({ error: "No se puede cargar un certificado vencido" });
            }

            const cert = await this.createUseCase.execute(request.body);
            return reply.status(201).send({ data: cert });
        } catch (error: any) {
            // TDD_0007: Capturar si el socio asociado no existe (Prisma Foreign Key o error de UseCase)
            if (error.message.includes('Foreign key') || error.message.includes('not found') || error.message.includes('no encontrado')) {
                return reply.status(404).send({ error: "Socio no encontrado" });
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
            const { issue_date, expiry_date } = request.body;

            // TDD_0008: Validar formato de UUID incorrecto
            if (!UUID_REGEX.test(id)) {
                return reply.status(400).send({ error: "El ID proporcionado no tiene un formato válido" });
            }

            // TDD_0008: Validar coherencia de fechas si se envían ambas en el PATCH
            if (issue_date || expiry_date) {
                if ((issue_date && !DATE_REGEX.test(issue_date)) || (expiry_date && !DATE_REGEX.test(expiry_date))) {
                    return reply.status(400).send({ error: "Formato de fecha debe ser YYYY-MM-DD" });
                }
                
                // Si el PATCH es parcial, tomamos las fechas cruzadas para validar consistencia
                const currentCert = await this.getUseCase.execute(); // O una búsqueda por ID directa
                const finalIssue = issue_date ? new Date(issue_date) : null;
                const finalExpiry = expiry_date ? new Date(expiry_date) : null;

                if (finalIssue && finalExpiry && finalExpiry < finalIssue) {
                    return reply.status(400).send({ error: "La fecha de vencimiento debe ser posterior a la de emisión" });
                }
            }

            const cert = await this.updateUseCase.execute(id, request.body);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            // TDD_0008: Certificado inexistente
            if (error.message.includes('Record to update not found') || error.message.includes('not found') || error.message.includes('no encontrado')) {
                return reply.status(404).send({ error: "No se encontró el certificado solicitado" });
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

            // TDD_0009: Formato de ID inválido
            if (!UUID_REGEX.test(id)) {
                return reply.status(400).send({ error: "El ID proporcionado no tiene un formato válido" });
            }

            await this.deleteUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            // TDD_0009: Certificado inexistente
            if (error.message.includes('Record to delete not found') || error.message.includes('not found') || error.message.includes('no encontrado')) {
                return reply.status(404).send({ error: "No se encontró el registro a eliminar" });
            }
            return reply.status(500).send({ error: "Error interno del servidor, intente más tarde" });
        }
    }
}