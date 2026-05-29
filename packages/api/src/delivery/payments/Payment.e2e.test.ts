import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/client.js'; 
import { CreatePaymentRequest } from '@alentapp/shared';

describe('Payment API End-to-End Tests - Flujo Alta', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let validMemberId: string;
    const createdPaymentIds: string[] = [];

    const randomSuffix = Math.floor(Math.random() * 100000).toString();

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
        
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const memberResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/socios',
            payload: {
                name: 'Socio Test E2E',
                dni: `E2E${randomSuffix}`,
                email: `e2e${randomSuffix}@test.com`,
                birthdate: '2000-01-01',
                category: 'Pleno'
            }
        });

        const memberBody = JSON.parse(memberResponse.payload);
        
        if (!memberBody.data || !memberBody.data.id) {
            throw new Error(`No se pudo inicializar el Socio de prueba en el setup E2E: ${memberResponse.payload}`);
        }

        validMemberId = memberBody.data.id;
    });

    afterAll(async () => {
        if (prisma) {
            if (createdPaymentIds.length > 0) {
                await prisma.payment.deleteMany({
                    where: { id: { in: createdPaymentIds } }
                });
            }
            if (validMemberId) {
                await prisma.member.deleteMany({
                    where: { id: validMemberId }
                });
            }
            await prisma.$disconnect();
        }
        if (app) {
            await app.close();
        }
    });

    it('1. POST: Debe registrar un cobro de manera exitosa en la base de datos real', async () => {
        const payload: CreatePaymentRequest = {
            amount: 8500,
            month: 5,
            year: 2026,
            due_date: '2026-06-15',
            member_id: validMemberId
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.id).toBeDefined();
        
        createdPaymentIds.push(body.data.id);

        const dbPayment = await prisma.payment.findUnique({
            where: { id: body.data.id }
        });
        expect(dbPayment).not.toBeNull();
        expect(dbPayment?.amount).toBe(8500);
    });

    it('2. POST: Debe retornar 400 si el payload infringe las reglas de negocio (monto <= 0)', async () => {
        const payload: CreatePaymentRequest = {
            amount: 0,
            month: 5,
            year: 2026,
            due_date: '2026-06-15',
            member_id: validMemberId
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(400);
    });

    it('3. POST: Debe retornar 404 si se intenta asociar a un socio inexistente', async () => {
        const payload: CreatePaymentRequest = {
            amount: 5000,
            month: 5,
            year: 2026,
            due_date: '2026-06-15',
            member_id: '00000000-0000-0000-0000-000000000000'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(404);
    });
});