import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js'; 
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { PostgresMedicalCertificateRepository } from '../../infrastructure/PostgresMedicalCertificateRepository.js';
import { PostgresMemberRepository } from '../../infrastructure/PostgresMemberRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

let app: FastifyInstance;

const VALID_MEMBER_UUID = '88888888-4444-4444-8888-121212121212';
const NON_EXISTENT_MEMBER_UUID = '99999999-9999-4999-a999-999999999999';
const VALID_CERT_UUID = '77777777-7777-4777-b777-777777777777';
const INTENTIONAL_404_CERT_UUID = '11111111-1111-4111-8111-111111111111';

describe('MedicalCertificate API Integration Tests - Suite Completa', () => {
    beforeAll(async () => {
        // =====================================================================
        // MOCKS DE INFRAESTRUCTURA
        // =====================================================================
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findAll').mockResolvedValue([]);
        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findByMemberId').mockResolvedValue([]);

        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'findById').mockImplementation(async (id: string) => {
            if (id === VALID_CERT_UUID) {
                return {
                    id: VALID_CERT_UUID,
                    issue_date: '2026-01-01',
                    expiry_date: '2026-06-01',
                    doctor_license: '123456',
                    is_validated: true,
                    member_id: VALID_MEMBER_UUID
                } as any;
            }
            return null;
        });

        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'create').mockImplementation(async (data: any) => {
            return { 
                id: '99999999-9999-9999-9999-999999999999', 
                ...data, 
                is_validated: true 
            };
        });

        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'update').mockImplementation(async (id, data: any) => {
            return {
                id,
                issue_date: data.issue_date || '2026-01-01',
                expiry_date: data.expiry_date || '2026-06-01',
                doctor_license: data.doctor_license || '123456',
                is_validated: data.is_validated !== undefined ? data.is_validated : true,
                member_id: VALID_MEMBER_UUID
            };
        });

        vi.spyOn(PostgresMedicalCertificateRepository.prototype, 'delete').mockResolvedValue(undefined);

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

        // =====================================================================
        // POST y PATCH
        // =====================================================================
        vi.spyOn(MedicalCertificateValidator.prototype, 'validateChronologicalDates').mockImplementation((issue, expiry) => {
            if (expiry.getTime() <= issue.getTime()) {
                throw new Error('La fecha de vencimiento es inválida (debe ser posterior a la de emisión)');
            }
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

    // =====================================================================
    // LECTURA: GET
    // =====================================================================
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

    // =====================================================================
    // ALTA (RAMA 1): POST
    // =====================================================================
    describe('POST /api/v1/medical-certificates', () => {
        it('debe retornar 201 y crear el certificado si pasa todos los filtros de dominio', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31', 
                doctor_license: '123456',
                member_id: VALID_MEMBER_UUID
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBeDefined();
        });

        it('debe retornar 400 si la fecha de vencimiento infringe las reglas cronológicas', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-20',
                expiry_date: '2026-05-01', 
                doctor_license: '123456',
                member_id: VALID_MEMBER_UUID
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload
            });

            expect(response.statusCode).toBe(400);
        });

        it('debe retornar 404 si se intenta asignar el certificado a un socio inexistente', async () => {
            const payload: CreateMedicalCertificateRequest = {
                issue_date: '2026-05-01',
                expiry_date: '2026-12-31',
                doctor_license: '123456',
                member_id: NON_EXISTENT_MEMBER_UUID
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

    // =====================================================================
    // MODIFICACIÓN (RAMA 2): PATCH
    // =====================================================================
    describe('PATCH /api/v1/medical-certificates/:id', () => {
        it('1. Debe retornar 200 OK y aplicar los cambios parciales enviados', async () => {
            const payload: UpdateMedicalCertificateRequest = {
                doctor_license: '888888', 
                is_validated: false
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/medical-certificates/${VALID_CERT_UUID}`,
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe(VALID_CERT_UUID);
            expect(body.data.doctor_license).toBe('888888');
            expect(body.data.is_validated).toBe(false);
        });

        it('2. Debe retornar 400 Bad Request si la nueva fecha de vencimiento rompe la coherencia cronológica', async () => {
            const payload: UpdateMedicalCertificateRequest = {
                expiry_date: '2025-01-01' 
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/medical-certificates/${VALID_CERT_UUID}`,
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('posterior a la de emisión');
        });
    });

    // =====================================================================
    // BAJA (RAMA 3): DELETE
    // =====================================================================
    describe('DELETE /api/v1/medical-certificates/:id', () => {
        it('1. Debe retornar código 204 No Content si se elimina físicamente de forma correcta', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/medical-certificates/${VALID_CERT_UUID}`
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe(''); 
        });

        it('2. Debe retornar código 404 Not Found si el certificado a eliminar no existe en el sistema', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/medical-certificates/${INTENTIONAL_404_CERT_UUID}`
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Certificado no encontrado');
        });
    });
});