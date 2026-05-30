import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/client.js'; 
import pg from 'pg';

describe('Locker API End-to-End Tests - Flujo Alta (POST /api/v1/lockers)', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    const createdLockerIds: string[] = [];
    
    // Generamos un número de casillero súper alto para que no choque con los reales de la BD
    const testLockerNumber = 99990 + Math.floor(Math.random() * 10); 

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
        
        const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        
        // Le pasamos el adaptador listo al cliente
        prisma = new PrismaClient({ adapter });
        await prisma.$connect();
        
        // Limpiamos si quedó algún casillero basura de este test antes de arrancar
        await prisma.locker.deleteMany({
            where: { number: testLockerNumber }
        });
    });

    afterAll(async () => {
        // Limpiamos los registros reales creados durante la prueba
        if (prisma) {
            if (createdLockerIds.length > 0) {
                await prisma.locker.deleteMany({
                    where: { id: { in: createdLockerIds } }
                });
            }
            await prisma.$disconnect();
        }
        if (app) {
            await app.close();
        }
    });

    it('1. E2E: Debe registrar un casillero de manera exitosa en la base de datos real', async () => {
        const payload = {
            number: testLockerNumber,
            location: 'Vestuario E2E Test'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        // 1. Validamos respuesta HTTP
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        const responseData = body.data || body;
        
        expect(responseData.id).toBeDefined();
        
        // Guardamos el ID real para borrarlo en el afterAll
        createdLockerIds.push(responseData.id);

        // 2. Validamos persistencia profunda en la BD Real
        const dbLocker = await prisma.locker.findUnique({
            where: { id: responseData.id }
        });
        
        expect(dbLocker).not.toBeNull();
        expect(dbLocker?.number).toBe(testLockerNumber);
        expect(dbLocker?.location).toBe('Vestuario E2E Test');
        expect(dbLocker?.status).toBe('Available');
    });

    it('2. E2E: Debe rebotar la petición y retornar 409/400 si se intenta crear con un número duplicado', async () => {
        // Volvemos a intentar mandar el mismo número que creamos en el test anterior
        const payload = {
            number: testLockerNumber,
            location: 'Otro Vestuario'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        // Verificamos que la BD real y el validador frenaron el duplicado
        expect(response.statusCode).toBeGreaterThanOrEqual(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toContain('registrado'); // "El número de casillero ya se encuentra registrado"
    });
});