import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/sports/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/sports/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message, statusCode: 500 });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                return reply.status(409).send({ error: error.message, statusCode: 409 }); 
            }
            if (error.message.includes('El cupo debe ser mayor a cero') || error.message.includes('El precio no puede ser negativo')) {
                return reply.status(400).send({ error: error.message, statusCode: 400 }); 
            }
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(id, request.body);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                return reply.status(404).send({ error: error.message, statusCode: 404 }); 
            }
            if (error.message.includes('El nombre del deporte es inmutable') || error.message.includes('La nueva capacidad debe ser mayor a cero')) {
                return reply.status(400).send({ error: error.message, statusCode: 400 }); 
            }
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteSportUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                return reply.status(404).send({ error: error.message, statusCode: 404 }); 
            }
            return reply.status(500).send({ error: "Error interno, por favor intente mas tarde", statusCode: 500 });
        }
    }
}