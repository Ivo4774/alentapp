import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { CreateSportRequest } from '@alentapp/shared';
import { PostgresSportRepository } from '../../infrastructure/PostgresSportRepository.js';

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        vi.spyOn(PostgresSportRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresSportRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            return id === '1' ? { id: '1', name: 'Original', description: 'Vieja', max_capacity: 10 } as any : null;
        });
        vi.spyOn(PostgresSportRepository.prototype, 'findByName').mockImplementation(async (name: string) => {
            return name === 'Natacion' ? { id: '1', name: 'Natacion' } as any : null;
        });
        vi.spyOn(PostgresSportRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { id: '2', ...data, created_at: new Date().toISOString() };
        });
        vi.spyOn(PostgresSportRepository.prototype, 'update').mockImplementation(async (id: string, data: any) => {
            return { id, ...data };
        });
        vi.spyOn(PostgresSportRepository.prototype, 'delete').mockResolvedValue(undefined);

        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
        vi.restoreAllMocks(); // Buena práctica: restaurar mocks globales al final
    });

    beforeEach(() => {
        vi.clearAllMocks(); // Limpiamos el conteo de los mocks antes de cada test para no arrastrar basura
    });

    describe('POST /api/v1/sports', () => {
        describe('con payload válido', () => {
            let response: any;
            let body: any;
            const payload: CreateSportRequest = {
                name: 'Tenis',
                description: 'Cancha de polvo de ladrillo',
                max_capacity: 4,
                additional_price: 1500,
                requires_medical_certificate: false
            };

            beforeEach(async () => {
                response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/sports',
                    payload
                });
                body = JSON.parse(response.payload);
            });

            it('debe retornar 201', () => {
                expect(response.statusCode).toBe(201);
            });

            it('debe llamar al repositorio para crear el recurso', () => {
                expect(PostgresSportRepository.prototype.create).toHaveBeenCalled();
            });

            it('debe devolver el nombre del deporte en el payload', () => {
                expect(body.data.name).toBe('Tenis');
            });

            it('debe devolver el ID del recurso creado', () => {
                expect(body.data.id).toBeDefined();
            });
        });

        describe('cuando el nombre del deporte ya existe', () => {
            let response: any;
            let body: any;
            const payload: CreateSportRequest = {
                name: 'Natacion',
                description: 'Pileta libre',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: true
            };

            beforeEach(async () => {
                response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/sports',
                    payload
                });
                body = JSON.parse(response.payload);
            });

            it('debe retornar 409', () => {
                expect(response.statusCode).toBe(409);
            });

            it('no debe llegar a llamar al repositorio create', () => {
                expect(PostgresSportRepository.prototype.create).not.toHaveBeenCalled();
            });

            it('debe devolver el mensaje de error correspondiente', () => {
                expect(body.error).toBe('Ya existe un deporte con ese nombre');
            });
        });
    });

    describe('PATCH /api/v1/sports/:id', () => {
        describe('con payload válido', () => {
            let response: any;
            let body: any;
            const payload = { description: 'Nueva', max_capacity: 50 };

            beforeEach(async () => {
                response = await app.inject({
                    method: 'PATCH',
                    url: '/api/v1/sports/1',
                    payload
                });
                body = JSON.parse(response.payload);
            });

            it('debe retornar 200', () => {
                expect(response.statusCode).toBe(200);
            });

            it('debe llamar al método update del repositorio con los datos parciales', () => {
                expect(PostgresSportRepository.prototype.update).toHaveBeenCalledWith('1', expect.objectContaining(payload));
            });

            it('debe devolver la descripción actualizada', () => {
                expect(body.data.description).toBe('Nueva');
            });

            it('debe devolver la capacidad actualizada', () => {
                expect(body.data.max_capacity).toBe(50);
            });
        });

        describe('cuando se intenta cambiar el nombre', () => {
            let response: any;
            let body: any;
            const payload = { name: 'Cambiado' };

            beforeEach(async () => {
                response = await app.inject({
                    method: 'PATCH',
                    url: '/api/v1/sports/1',
                    payload
                });
                body = JSON.parse(response.payload);
            });

            it('debe retornar 400', () => {
                expect(response.statusCode).toBe(400);
            });

            it('no debe llamar al repositorio para actualizar', () => {
                expect(PostgresSportRepository.prototype.update).not.toHaveBeenCalled();
            });

            it('debe devolver el error de inmutabilidad del nombre', () => {
                expect(body.error).toBe('El nombre del deporte es inmutable');
            });
        });
    });

    describe('DELETE /api/v1/sports/:id', () => {
        describe('cuando el deporte existe', () => {
            let response: any;

            beforeEach(async () => {
                response = await app.inject({
                    method: 'DELETE',
                    url: '/api/v1/sports/1'
                });
            });

            it('debe retornar 204', () => {
                expect(response.statusCode).toBe(204);
            });

            it('debe llamar al repositorio para eliminar el ID', () => {
                expect(PostgresSportRepository.prototype.delete).toHaveBeenCalledWith('1');
            });

            it('debe tener un payload vacío', () => {
                expect(response.payload).toBe('');
            });
        });

        describe('cuando el deporte no existe', () => {
            let response: any;
            let body: any;

            beforeEach(async () => {
                response = await app.inject({
                    method: 'DELETE',
                    url: '/api/v1/sports/999'
                });
                body = JSON.parse(response.payload);
            });

            it('debe retornar 404', () => {
                expect(response.statusCode).toBe(404);
            });

            it('no debe llamar al repositorio para eliminar', () => {
                expect(PostgresSportRepository.prototype.delete).not.toHaveBeenCalled();
            });

            it('debe devolver el error de no existencia', () => {
                expect(body.error).toBe('El deporte no existe');
            });
        });
    });
});
