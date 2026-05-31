import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayPaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { PayPaymentRequest, PaymentDTO } from '@alentapp/shared';

describe('PayPaymentUseCase', () => {
    let paymentRepoMock: PaymentRepository;
    let paymentValidatorMock: PaymentValidator;
    let useCase: PayPaymentUseCase;

    beforeEach(() => {
        paymentRepoMock = {
            updateStatus: vi.fn(),
            findAll: vi.fn(),
        } as unknown as PaymentRepository;

        paymentValidatorMock = {
            validatePay: vi.fn(),
            validateCreate: vi.fn(),
        } as unknown as PaymentValidator;

        useCase = new PayPaymentUseCase(paymentRepoMock, paymentValidatorMock);
    });

    it('debe registrar el pago de manera exitosa si pasa las verificaciones de estado', async () => {
        const paymentId = 'pago-123';
        const requestData: PayPaymentRequest = { payment_date: '2026-05-29' };
        
        const expectedDto: PaymentDTO = {
            id: paymentId,
            amount: 5000,
            status: 'Paid',
            member_id: 'socio-1',
            month: 5,
            year: 2026,
            due_date: '2026-05-15',
            payment_date: '2026-05-29'
        };

        vi.mocked(paymentValidatorMock.validatePay).mockResolvedValue(undefined);
        vi.mocked(paymentRepoMock.updateStatus).mockResolvedValue(expectedDto);

        const result = await useCase.execute(paymentId, requestData);

        expect(paymentValidatorMock.validatePay).toHaveBeenCalledWith(paymentId, requestData.payment_date);
        expect(paymentRepoMock.updateStatus).toHaveBeenCalledWith(paymentId, 'Paid', new Date(requestData.payment_date));
        expect(result).toEqual(expectedDto);
    });

    it('debe propagar un error y no guardar si el validador detecta que el pago ya estaba anulado o procesado', async () => {
        const paymentId = 'pago-ya-anulado';
        const requestData: PayPaymentRequest = { payment_date: '2026-05-29' };

        vi.mocked(paymentValidatorMock.validatePay).mockRejectedValue(
            new Error('Transición inválida: El pago ya se encuentra anulado o cerrado')
        );

        await expect(useCase.execute(paymentId, requestData)).rejects.toThrow(
            'Transición inválida: El pago ya se encuentra anulado o cerrado'
        );

        expect(paymentRepoMock.updateStatus).not.toHaveBeenCalled();
    });

    it('debe propagar un error si el repositorio no encuentra el ID del pago a modificar', async () => {
        const paymentId = 'pago-fantasma';
        const requestData: PayPaymentRequest = { payment_date: '2026-05-29' };

        vi.mocked(paymentValidatorMock.validatePay).mockResolvedValue(undefined);
        vi.mocked(paymentRepoMock.updateStatus).mockRejectedValue(new Error('Pago no encontrado'));

        await expect(useCase.execute(paymentId, requestData)).rejects.toThrow('Pago no encontrado');
    });
});