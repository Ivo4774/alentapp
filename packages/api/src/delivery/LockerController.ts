import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared'; 
import { CreateLockerUseCase } from '../application/locker/NewLockerUseCase.js'; 
import { GetLockersUseCase } from '../application/locker/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../application/locker/UpdateLockerUseCase.js'; 
import { DeleteLockerUseCase } from '../application/locker/DeleteLockerUseCase.js';

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
            // Mapeo TDD-0010
            if (error.message === 'El número y la ubicación son obligatorios') {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'El número de casillero ya se encuentra registrado' || error.message === 'No se puede asignar un casillero en mantenimiento') {
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
            // Mapeo semántico estricto según la tabla del TDD-0011
            if (error.message === 'Datos de actualización inválidos') {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'El casillero no existe' || error.message === 'El socio referenciado no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'Ya existe un casillero con ese número' || error.message === 'No se puede asignar un casillero en mantenimiento' || error.message === 'El socio ya tiene un casillero asignado') {
                return reply.status(409).send({ error: error.message });
            }

           
            
            return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
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
            if (error.message === 'No se puede eliminar un casillero asignado') {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
        }
    }
}

