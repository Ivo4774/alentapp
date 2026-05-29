import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js'; 
import { CreateMedicalCertificateRequest } from '@alentapp/shared';
import { PostgresMedicalCertificateRepository } from '../../infrastructure/PostgresMedicalCertificateRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';

let app: FastifyInstance;

const VALID_MEMBER_UUID = '88888888-4444-4444-8888-121212121212';
const NON_EXISTENT_MEMBER_UUID = '99999999-9999-4999-a999-999999999999';

describe('MedicalCertificate API Integration Tests - Alta', () => {
    beforeAll(async () => {
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findByMemberId').mockResolvedValue([]);

        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { 
                id: '99999999-9999-9999-9999-999999999999', 
                ...data, 
                is_validated: true 
            };
        });

        vi.spyOn(PostgresMemberRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === VALID_MEMBER_UUID) {
                return {
                    id: VALID_MEMBER_UUID,
                    name: 'Ivo Balduzzi',
                    dni: '45123456',
                    email: 'ivo@alentapp.com',
                    birthdate: '2000-01-01',
                    category: 'Pleno'
                } as any;
            }
            return null;
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

    describe('GET /api/v1/medical-certificates', () => {
        it('debe retornar código 200 y el listado de todos los certificados', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/medical-certificates'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/v1/medical-certificates', () => {
        it('debe retornar 201 y crear el certificado si pasa todos los filtros de dominio', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31', 
                doctor_license: '123456',
                member_id: VALID_MEMBER_UUID // UUID Válido
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBeDefined();
            expect(body.data.is_validated).toBe(true);
        });

        it('debe retornar 400 si la fecha de vencimiento infringe las reglas cronológicas', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-20',
                expiry_date: '2026-05-01', // Error de fecha de vencimiento menor a fecha de emisión
                doctor_license: '123456',
                member_id: VALID_MEMBER_UUID
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de vencimiento es inválida');
        });

        it('debe retornar 404 si se intenta asignar el certificado a un socio inexistente', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: NON_EXISTENT_MEMBER_UUID // Estructura UUID válida, pero no va a existir en el mock
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Socio no encontrado');
        });
    });
});