import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findAll() { return []; }
            async findById(id: string) { return id === '1' ? { id: '1', name: 'Original', description: 'Vieja', max_capacity: 10 } : null; }
            async findByName(name: string) { return name === 'Natacion' ? { id: '1', name: 'Natacion' } : null; }
            async create(data: any) { return { id: '2', ...data, created_at: new Date().toISOString() }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

describe('Sport API Integration Tests - Creación', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte con payload valido', async () => {
            const payload: CreateSportRequest = {
                name: 'Tenis',
                description: 'Cancha de polvo de ladrillo',
                max_capacity: 4,
                additional_price: 1500,
                requires_medical_certificate: false
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.name).toBe('Tenis');
            expect(body.data.id).toBeDefined();
        });

        it('debe retornar 409 si el nombre del deporte ya existe', async () => {
            const payload: CreateSportRequest = {
                name: 'Natacion',
                description: 'Pileta libre',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: true
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un deporte con ese nombre');
        });
    });

    describe('PATCH /api/v1/sports/:id', () => {
        it('debe retornar 200 y actualizar el deporte con un payload válido', async () => {
            const payload = { description: 'Nueva', max_capacity: 50 };
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/1',
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.description).toBe('Nueva');
            expect(body.data.max_capacity).toBe(50);
        });

        it('debe retornar 400 si se intenta cambiar el nombre', async () => {
            const payload = { name: 'Cambiado' };
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/1',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El nombre del deporte es inmutable');
        });
    });
});
