import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared'; 
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js'; 
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js'; 
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,     
        private readonly updateLockerUseCase: UpdateLockerUseCase,  
        private readonly deleteLockerUseCase: DeleteLockerUseCase   
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const lockers = await this.getLockersUseCase.execute();
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero con ese número')) {
                return reply.status(409).send({ error: error.message }); 
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const result = await this.updateLockerUseCase.execute(
                request.params.id,
                request.body
            );
            return reply.status(200).send({ data: result });
        } catch (error: any) {
            if (error.message === 'El casillero no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'Ya existe un casillero con ese número') {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, por favor intente más tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            await this.deleteLockerUseCase.execute(request.params.id);
            return reply.status(204).send(); // 204 No Content es el estándar para un borrado exitoso
        } catch (error: any) {
            if (error.message === 'El casillero no existe') {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, por favor intente más tarde' });
        }
    }
}

