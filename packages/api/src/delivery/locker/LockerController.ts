import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared'; 
import { CreateLockerUseCase } from '../../application/locker/NewLockerUseCase.js'; 
import { GetLockersUseCase } from '../../application/locker/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../../application/locker/UpdateLockerUseCase.js'; 
import { DeleteLockerUseCase } from '../../application/locker/DeleteLockerUseCase.js';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('alentapp-api');
const requestCounter = meter.createCounter('http.requests.total');
const errorCounter = meter.createCounter('http.requests.errors');
const requestDuration = meter.createHistogram('http.request.duration', { unit: 'ms' });

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,     
        private readonly updateLockerUseCase: UpdateLockerUseCase,  
        private readonly deleteLockerUseCase: DeleteLockerUseCase   
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const lockers = await this.getLockersUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            // Mapeo TDD-0010
            if (error.message === 'El número y la ubicación son obligatorios') {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'El número de casillero ya se encuentra registrado' || error.message === 'No se puede asignar un casillero en mantenimiento') {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const result = await this.updateLockerUseCase.execute(
                request.params.id,
                request.body
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: result });
        } catch (error: any) {
            // Mapeo semántico estricto según la tabla del TDD-0011
            if (error.message === 'Datos de actualización inválidos') {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'El casillero no existe' || error.message === 'El socio referenciado no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'El número de casillero ya se encuentra registrado' || error.message === 'No se puede asignar un casillero en mantenimiento' || error.message === 'El socio ya tiene un casillero asignado') {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
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
            await this.deleteLockerUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send(); // 204 No Content es el estándar para un borrado exitoso
        } catch (error: any) {
            if (error.message === 'El casillero no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'No se puede eliminar un casillero asignado') {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}