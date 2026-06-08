import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../../application/sports/NewSportUseCase.js';
import { GetSportsUseCase } from '../../application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../../application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../../application/sports/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('alentapp-api');
const requestCounter = meter.createCounter('http.requests.total');
const errorCounter = meter.createCounter('http.requests.errors');
const requestDuration = meter.createHistogram('http.request.duration', { unit: 'ms' });

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) { }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const sports = await this.getSportsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message, statusCode: 500 });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const sport = await this.createSportUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message, statusCode: 409 });
            }
            if (error.message.includes('El cupo debe ser mayor a cero') || error.message.includes('El precio no puede ser negativo')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, statusCode: 400 });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];

        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, statusCode: 404 });
            }
            if (error.message.includes('El nombre del deporte es inmutable') || error.message.includes('La nueva capacidad debe ser mayor a cero')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, statusCode: 400 });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
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
            await this.deleteSportUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, statusCode: 404 });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}