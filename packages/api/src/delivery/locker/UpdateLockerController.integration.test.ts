import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PostgresLockerRepository } from '../../infrastructure/PostgresLockerRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';
import { PostgresPaymentRepository } from '../../infrastructure/PostgresPaymentRepository.js';
import { PostgresSportRepository } from '../../infrastructure/PostgresSportRepository.js';
import { PostgresMedicalCertificateRepository } from '../../infrastructure/PostgresMedicalCertificateRepository.js';

const EXISTING_LOCKER_ID = 'uuid-1234-5678';
const NON_EXISTENT_LOCKER_ID = 'uuid-0000-0000';

describe('Locker API Integration Tests - Modificación (PATCH /api/v1/lockers/:id)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // 1. Silenciamos la carga inicial de todas las dependencias
        vi.spyOn(PostgresMemberRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresPaymentRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresSportRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findAll').mockResolvedValue([]);

        // 2. Mockeamos el comportamiento específico para Casilleros
        vi.spyOn(PostgresLockerRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === EXISTING_LOCKER_ID) {
                return { id: EXISTING_LOCKER_ID, number: 10, location: 'Vestuario A', status: 'Available' } as any;
            }
            return null;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'findByNumber').mockImplementation(async (number: number) => {
            // Simulamos que el número 99 ya está ocupado por otro casillero
            if (number === 99) {
                return { id: 'otro-uuid', number: 99, location: 'Pasillo' } as any;
            }
            return null;
        });

        vi.spyOn(PostgresLockerRepository.prototype, 'update').mockImplementation(async (id: string, data: any) => {
            return { id, number: data.number || 10, location: data.location || 'Vestuario A', status: data.status || 'Available' } as any;
        });

        // 3. Levantamos la app
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        vi.restoreAllMocks();
    });

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

        // 1. PRIMERO declaramos la variable
        const body = JSON.parse(response.payload);
        
        // 2. SEGUNDO la imprimimos (así si explota después, esto ya se vio)
        console.log("🔥 ERROR DEL SERVIDOR:", body);

        // 3. TERCERO y ÚLTIMO, hacemos las aserciones
        expect(response.statusCode).toBe(409);
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