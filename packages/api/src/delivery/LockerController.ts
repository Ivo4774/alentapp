import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest } from '@alentapp/shared';
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js'; 

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase
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
            // Ejecutamos el caso de uso (la lógica de negocio)
            const locker = await this.createLockerUseCase.execute(request.body);
            
            // Según el TDD-0010, devolvemos 201 Created si es exitoso
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            // Evaluamos la regla de negocio: El número debe ser único
            if (error.message.includes('Ya existe un casillero con ese número')) {
                return reply.status(409).send({ error: error.message }); // 409 Conflict
            }
            
            // Error 500 para fallos generales de DB o servidor
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
}