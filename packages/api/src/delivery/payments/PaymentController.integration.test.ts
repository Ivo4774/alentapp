import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js'; 
import { CreatePaymentRequest, PayPaymentRequest } from '@alentapp/shared';

// Importamos los repositorios reales para poder espiar sus prototipos
import { PostgresPaymentRepository } from '../../infrastructure/PostgresPaymentRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';

let app: FastifyInstance;

describe('Payment API Integration Tests', () => {

    beforeAll(async () => {
        // 1. Mock de findAll
        vi.spyOn(PostgresPaymentRepository.prototype, 'findAll').mockResolvedValue([
            { id: 'pago-1', amount: 5000, status: 'Pending', memberId: 'socio-1', member_id: 'socio-1', month: 5, year: 2026, due_date: new Date('2026-05-15') }
        ]);

        // 2. Mock de findById
        vi.spyOn(PostgresPaymentRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === 'pago-1') {
                return { 
                    id: 'pago-1', 
                    amount: 5000, 
                    status: 'Pending', 
                    memberId: 'socio-1', 
                    member_id: 'socio-1',
                    month: 5, 
                    year: 2026,
                    due_date: new Date('2026-05-15')
                };
            }
            return null;
        });

        // 3. Mock de create
        vi.spyOn(PostgresPaymentRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { id: 'pago-nuevo-123', ...data, status: 'Pending' };
        });

        // 4. CORREGIDO: Mapeamos a updateStatus que es el método real de la interfaz
        vi.spyOn(PostgresPaymentRepository.prototype, 'updateStatus').mockImplementation(async (id: string, status: any, paymentDate: Date) => {
            return { 
                id, 
                amount: 5000, 
                status: status, // Tomará 'Paid' provisto por el controlador
                memberId: 'socio-1', 
                member_id: 'socio-1',
                month: 5, 
                year: 2026,
                due_date: new Date('2026-05-15'),
                payment_date: paymentDate
            };
        });

        // 5. CORREGIDO: Mapeamos a cancel que es el método real de la interfaz
        vi.spyOn(PostgresPaymentRepository.prototype, 'cancel').mockImplementation(async (id: string) => {
            return {
                id,
                amount: 5000,
                status: 'Cancelled',
                memberId: 'socio-1',
                member_id: 'socio-1',
                month: 5,
                year: 2026,
                due_date: new Date('2026-05-15')
            };
        });

        // Mock del repositorio de miembros
        vi.spyOn(PostgresMemberRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            return id === 'socio-1' ? { id: 'socio-1', name: 'Belu Pieroni' } : null;
        });

        // Inicializamos la aplicación Fastify
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        vi.restoreAllMocks();
    });

    // 1. Test para Listar Pagos (GET)
    describe('GET /api/v1/payments', () => {
        it('debe retornar código 200 y el listado de todos los pagos registrados', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/payments'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('pago-1');
        });
    });

    // 2, 3 y 4. Tests para la Creación de Pagos (POST)
    describe('POST /api/v1/payments', () => {
        it('debe retornar 201 y crear el pago de manera exitosa si pasa los filtros', async () => {
            const payload: CreatePaymentRequest = {
                amount: 7500,
                month: 6,
                year: 2026,
                due_date: '2026-06-15',
                member_id: 'socio-1'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('pago-nuevo-123');
        });

        it('debe retornar 400 si el monto ingresado infringe las reglas de negocio (monto <= 0)', async () => {
            const payload: CreatePaymentRequest = {
                amount: -50,
                month: 6,
                year: 2026,
                due_date: '2026-06-15',
                member_id: 'socio-1'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El monto debe ser mayor a cero');
        });

        it('debe retornar 404 si se intenta asignar un pago a un socio inexistente', async () => {
            const payload: CreatePaymentRequest = {
                amount: 6000,
                month: 6,
                year: 2026,
                due_date: '2026-06-15',
                member_id: 'socio-no-existe'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Socio no encontrado');
        });
    });

    // 5. Test para Registrar el pago en efectivo (PATCH)
    describe('PATCH /api/v1/payments/:id/pay', () => {
        it('debe retornar 200 y actualizar el estado del pago a Paid', async () => {
            const payload: PayPaymentRequest = {
                payment_date: '2026-05-28T00:00:00.000Z'
            };

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/pago-1/pay',
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Paid');
        });
    });

    // 6. Test para Anular un Registro de Pago (DELETE)
    describe('DELETE /api/v1/payments/:id/cancel', () => {
        it('debe retornar código de estado 204 ante una anulación exitosa', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/pago-1' 
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });
    });
});