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
    });

    describe('validatePay', () => {
        it('debe pasar si el pago existe y está en estado Pendiente', async () => {
            vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({ id: 'pago-1', status: 'Pending' } as any);
            
            await expect(validator.validatePay('pago-1', '2026-05-30')).resolves.not.toThrow();
        });

        it('debe lanzar error si el pago ya está pagado o anulado', async () => {
            vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({ id: 'pago-1', status: 'Paid' } as any);
            
            await expect(validator.validatePay('pago-1', '2026-05-30')).rejects.toThrow('El pago ya fue registrado como pagado');
        });

        it('debe lanzar error si el pago no existe', async () => {
            vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);
            
            await expect(validator.validatePay('pago-invalido', '2026-05-30')).rejects.toThrow('Pago no encontrado');
        });
    });
});