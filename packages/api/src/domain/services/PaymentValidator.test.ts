import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';
import { PaymentRepository } from '../PaymentRepository.js';
import { MemberRepository } from '../MemberRepository.js';

describe('PaymentValidator', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
    } as unknown as PaymentRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new PaymentValidator(mockPaymentRepo, mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateCreate', () => {
        it('debe lanzar un error si faltan campos obligatorios en el payload', async () => {
            const payloadIncompleto = {
                amount: 5000,
                month: 5
                // year, due_date y member_id faltantes
            };

            await expect(validator.validateCreate(payloadIncompleto as any))
                .rejects
                .toThrow('Faltan campos obligatorios');
        });

        it('debe lanzar un error si el monto es igual o menor a cero', async () => {
            const payloadMontoInvalido = {
                amount: -10,
                month: 5,
                year: 2026,
                due_date: '2026-06-10',
                member_id: 'socio-123'
            };

            await expect(validator.validateCreate(payloadMontoInvalido))
                .rejects
                .toThrow('El monto debe ser mayor a cero');
        });

        it('debe lanzar un error si la fecha de vencimiento es cronológicamente menor al período de referencia', async () => {
            const payloadFechaInvalida = {
                amount: 3500,
                month: 5,
                year: 2026,
                due_date: '2026-04-30', // Vencimiento menor al período
                member_id: 'socio-123'
            };

            await expect(validator.validateCreate(payloadFechaInvalida))
                .rejects
                .toThrow('La fecha de vencimiento no puede ser menor al período de referencia');
        });

        it('debe lanzar un error si el socio asociado no existe en el sistema', async () => {
            const payloadSocioInexistente = {
                amount: 4000,
                month: 5,
                year: 2026,
                due_date: '2026-06-15',
                member_id: 'socio-no-existe'
            };

            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

            await expect(validator.validateCreate(payloadSocioInexistente))
                .rejects
                .toThrow('Socio no encontrado');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-no-existe');
        });
    });
});