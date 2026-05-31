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
const EXISTING_LOCKER_ID = 'uuid-1234-5678';

describe('Locker API Integration Tests - Completo', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // 1. Silenciamos otros repositorios para evitar que busquen la BD real al inicializar la app
        vi.spyOn(PostgresMemberRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresPaymentRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresSportRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findAll').mockResolvedValue([]);

        // 2. Mocks consolidados para Locker Repository usando spyOn
        vi.spyOn(PostgresLockerRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { id: 'uuid-2', ...data, status: 'Available', member_id: null };
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === AVAILABLE_LOCKER_ID) {
                return { id: AVAILABLE_LOCKER_ID, number: 10, status: 'Available', location: 'Vestuario A' } as any;
            }
            if (id === ASSIGNED_LOCKER_ID) {
                return { id: ASSIGNED_LOCKER_ID, number: 20, status: 'Occupied', memberId: 'socio-1', location: 'Vestuario B' } as any;
            }
            if (id === EXISTING_LOCKER_ID) {
                return { id: EXISTING_LOCKER_ID, number: 10, location: 'Vestuario A', status: 'Available' } as any;
            }
            return null;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'findByNumber').mockImplementation(async (number: number) => {
            if (number === 15) { // Simula número ocupado para el test de Alta
                return { id: 'uuid-1', number: 15, location: 'Vestuario 1', status: 'Available', member_id: null };
            }
            if (number === 99) { // Simula número ocupado para el test de Modificación
                return { id: 'otro-uuid', number: 99, location: 'Pasillo' } as any;
            }
            return null;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'update').mockImplementation(async (id: string, data: any) => {
            return { id, number: data.number || 10, location: data.location || 'Vestuario A', status: data.status || 'Available' } as any;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'delete').mockResolvedValue(undefined);

        // 3. Levantamos la app una única vez para toda la suite
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        vi.restoreAllMocks();
    });

    // ==========================================
    // SECCIÓN 1: ALTA (POST)
    // ==========================================
    describe('POST /api/v1/lockers', () => {
        it('debe retornar 201 y crear el casillero exitosamente', async () => {
            const payload = { number: 10, location: 'Pasillo Principal' };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            const responseData = body.data || body;
            expect(responseData.number).toBe(10);
            expect(responseData.location).toBe('Pasillo Principal');
            expect(responseData.status).toBe('Available');
        });

        it('debe atravesar la capa de validación y retornar error si el número de casillero ya existe', async () => {
            const payload = { number: 15, location: 'Vestuario 2' };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBeGreaterThanOrEqual(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El número de casillero ya se encuentra registrado');
        });
    });

    // ==========================================
    // SECCIÓN 2: MODIFICACIÓN (PATCH)
    // ==========================================
    describe('PATCH /api/v1/lockers/:id', () => {
        it('debe retornar 200 y actualizar el casillero correctamente', async () => {
            const payload = { location: 'Vestuario Renovado' };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${EXISTING_LOCKER_ID}`,
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            const responseData = body.data || body;
            expect(responseData.location).toBe('Vestuario Renovado');
        });

        it('debe retornar 409 si se intenta actualizar con un número ya en uso', async () => {
            const payload = { number: 99 };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${EXISTING_LOCKER_ID}`,
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('registrado');
        });

        it('debe retornar 404 si se intenta actualizar un casillero que no existe', async () => {
            const payload = { location: 'Lugar X' };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${NON_EXISTENT_LOCKER_ID}`,
                payload
            });

            expect(response.statusCode).toBe(404);
        });
    });

    // ==========================================
    // SECCIÓN 3: ELIMINACIÓN (DELETE)
    // ==========================================
    describe('DELETE /api/v1/lockers/:id', () => {
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
});