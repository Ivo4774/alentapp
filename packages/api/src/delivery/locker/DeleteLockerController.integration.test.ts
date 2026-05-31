import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PostgresLockerRepository } from '../../infrastructure/PostgresLockerRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';
import { PostgresPaymentRepository } from '../../infrastructure/PostgresPaymentRepository.js';
import { PostgresSportRepository } from '../../infrastructure/PostgresSportRepository.js';
import { PostgresMedicalCertificateRepository } from '../../infrastructure/PostgresMedicalCertificateRepository.js';

const AVAILABLE_LOCKER_ID = 'uuid-libre-123';
const ASSIGNED_LOCKER_ID = 'uuid-asignado-456';
const NON_EXISTENT_LOCKER_ID = 'uuid-no-existe-789';

describe('Locker API Integration Tests - Eliminación (DELETE /api/v1/lockers/:id)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        vi.spyOn(PostgresMemberRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresPaymentRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresSportRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findAll').mockResolvedValue([]);

        vi.spyOn(PostgresLockerRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === AVAILABLE_LOCKER_ID) {
                return { id: AVAILABLE_LOCKER_ID, number: 10, status: 'Available' } as any;
            }
            if (id === ASSIGNED_LOCKER_ID) {
                return { id: ASSIGNED_LOCKER_ID, number: 20, status: 'Occupied', memberId: 'socio-1' } as any;
            }
            return null;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'delete').mockResolvedValue(undefined);

        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        vi.restoreAllMocks();
    });

    it('debe retornar 204 sin contenido al eliminar un casillero libre de manera exitosa', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/lockers/${AVAILABLE_LOCKER_ID}`
        });

        expect(response.statusCode).toBe(204);
        expect(response.payload).toBe('');
    });

    it('debe retornar 409 si se intenta eliminar un casillero que se encuentra asignado', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/lockers/${ASSIGNED_LOCKER_ID}`
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('No se puede eliminar un casillero asignado');
    });

    it('debe retornar 404 si el casillero solicitado no existe', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/lockers/${NON_EXISTENT_LOCKER_ID}`
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El casillero no existe');
    });
});