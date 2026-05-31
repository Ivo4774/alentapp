import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js'; 
import { CreatePaymentRequest } from '@alentapp/shared';

import { PostgresPaymentRepository } from '../../infrastructure/PostgresPaymentRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';

let app: FastifyInstance;

describe('Payment API Integration Tests - Completo', () => {

    beforeAll(async () => {
        vi.spyOn(PostgresMemberRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === 'socio-1') {
                return {
                    id: 'socio-1',
                    name: 'Belen Pieroni',
                    dni: '44123456',
                    email: 'pieroni@alentapp.com',
                    birthdate: '2000-01-01',
                    category: 'Pleno'
                } as any;
            }
            return null;
        });

        vi.spyOn(PostgresPaymentRepository.prototype, 'findAll').mockResolvedValue([
            { id: 'pago-1', amount: 5000, status: 'Pending', member_id: 'socio-1', month: 5, year: 2026, due_date: '2026-05-15', payment_date: null }
        ]);

        vi.spyOn(PostgresPaymentRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { id: 'pago-nuevo-123', ...data, status: 'Pending' };
        });

        vi.spyOn(PostgresPaymentRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === 'pago-1') {
                return { id: 'pago-1', status: 'Pending', amount: 5000 } as any;
            }
            return null;
        });

        vi.spyOn(PostgresPaymentRepository.prototype, 'updateStatus').mockImplementation(async (id: string, status: string) => {
            return { id, status: 'Paid' } as any;
        });

        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        vi.restoreAllMocks();
    });

    // Test para Listar Pagos (GET)
    describe('GET /api/v1/payments', () => {
        it('debe retornar código 200 y el listado de todos los pagos registrados', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/payments'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
        });
    });

    // Tests para la Creación de Pagos (POST)
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
        });
    });

    // Test para Pagar/Actualizar Pago (PATCH)
    describe('PATCH /api/v1/payments/:id/pay', () => {
        it('debe retornar 200 y marcar el pago como "Paid" exitosamente', async () => {
            const paymentId = 'pago-1';
            const payload = { payment_date: '2026-05-30' };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/payments/${paymentId}/pay`,
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Paid');
        });

        it('debe retornar 404 si el pago que se quiere pagar no existe', async () => {
            vi.spyOn(PostgresPaymentRepository.prototype, 'updateStatus')
                .mockRejectedValueOnce(new Error('Pago no encontrado'));

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/pago-inexistente/pay',
                payload: { payment_date: '2026-05-30' }
            });

            expect(response.statusCode).toBe(404);
        });
    });

    // Test para Cancelar/Anular Pago (DELETE)
    describe('DELETE /api/v1/payments/:id', () => {
        it('debe retornar 204 si se anula correctamente', async () => {
            vi.spyOn(PostgresPaymentRepository.prototype, 'cancel').mockResolvedValue({ 
                id: 'pago-1', 
                status: 'Canceled' 
            } as any);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/pago-1' 
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 404 si el pago a anular no existe', async () => {
            vi.spyOn(PostgresPaymentRepository.prototype, 'cancel').mockRejectedValue(new Error('Pago no encontrado'));

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/pago-inexistente'
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Pago no encontrado');
        });

        it('debe retornar 409 si el pago ya está pagado', async () => {
            vi.spyOn(PostgresPaymentRepository.prototype, 'findById').mockResolvedValueOnce({ 
                id: 'pago-pagado', 
                status: 'Paid' 
            } as any);
            vi.spyOn(PostgresPaymentRepository.prototype, 'cancel').mockRejectedValue(new Error('No se puede anular un pago ya pagado'));

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/pago-pagado'
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('No se puede anular un pago ya pagado');
        });
    });
});