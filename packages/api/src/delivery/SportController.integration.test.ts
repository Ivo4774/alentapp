import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findAll() { return []; }
            async findById(id: string) { return null; }
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
});
