import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
// Ajustá la ruta según dónde esté tu app.js
import { buildApp } from '../app.js'; 

// Mockeamos el repositorio igual que en Members para probar la integración de toda la capa HTTP
vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async findByNumber(number: number) {
                // Simulamos que el casillero #15 ya existe en la base de datos
                return number === 15 ? { id: 'uuid-1', number: 15, location: 'Vestuario 1', status: 'Available', member_id: null } : null;
            }
            async create(data: any) {
                // Simulamos la creación exitosa devolviendo el objeto armado
                return { id: 'uuid-2', ...data, status: 'Available', member_id: null };
            }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            // No necesitamos simular métodos complejos acá porque solo estamos testeando lockers,
            // esto solo sirve para que la app no intente conectarse a la BD al arrancar.
        }
    };
});

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            // Mock vacío para que la app no pida la BD al cargar el módulo de pagos
        }
    };
});

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {}
    };
});

vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
    return {
        PostgresMedicalCertificateRepository: class {}
    };
});

describe('Locker API Integration Tests - Alta (POST /api/v1/lockers)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // Esperamos a que todos los plugins carguen
    });

    afterAll(async () => {
        await app.close();
    });

    it('debe retornar 201 y crear el casillero exitosamente', async () => {
        const payload = {
            number: 10,
            location: 'Pasillo Principal'
        };

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
        const payload = {
            number: 15, // Este número lo mockeamos como existente arriba
            location: 'Vestuario 2'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        // Verificamos que rebote (generalmente tu controlador lanzará un 400 o 409)
        expect(response.statusCode).toBeGreaterThanOrEqual(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El número de casillero ya se encuentra registrado');
    });
});