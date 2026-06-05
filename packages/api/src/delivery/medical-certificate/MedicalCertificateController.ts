import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../../application/medical-certificate/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../../application/medical-certificate/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../../application/medical-certificate/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../../application/medical-certificate/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('alentapp-api');
const requestCounter = meter.createCounter('http.requests.total');
const errorCounter = meter.createCounter('http.requests.errors');
const requestDuration = meter.createHistogram('http.request.duration', { unit: 'ms' });

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly getUseCase: GetMedicalCertificatesUseCase,
        private readonly updateUseCase: UpdateMedicalCertificateUseCase,
        private readonly deleteUseCase: DeleteMedicalCertificateUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const certs = await this.getUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno del servidor" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async getByMember(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const { memberId } = request.params;
            const certs = await this.getUseCase.execute(memberId);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            if (error.message.includes('formato válido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno del servidor" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMedicalCertificateRequest & { file_data?: string | null } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const cert = await this.createUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
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
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Socio no encontrado") {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno del servidor" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest & { file_data?: string | null } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const { id } = request.params;
            const cert = await this.updateUseCase.execute(id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            if (error.message.includes('formato válido') || error.message.includes('posterior a la de emisión')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Certificado no encontrado") {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, por favor intente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const { id } = request.params;
            await this.deleteUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('formato válido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            if (error.message === "Certificado no encontrado") {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno del servidor, intente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}