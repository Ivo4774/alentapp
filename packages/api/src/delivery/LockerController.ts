import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest } from '@alentapp/shared';
// Importaremos el caso de uso que vamos a crear en el próximo paso
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
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
}