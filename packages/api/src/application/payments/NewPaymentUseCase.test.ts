import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './NewPaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { CreatePaymentRequest } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    const mockPaymentRepo = {
        create: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateCreate: vi.fn(),
    } as unknown as PaymentValidator;

    const useCase = new CreatePaymentUseCase(mockPaymentRepo, mockPaymentValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un pago de manera exitosa si pasa las validaciones del dominio', async () => {
        const mockRequest: CreatePaymentRequest = {
            amount: 7500,
            month: 5,
            year: 2026,
            due_date: '2026-06-10',
            member_id: 'socio-valido-uuid'
        };

        vi.mocked(mockPaymentValidator.validateCreate).mockResolvedValueOnce();

        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce({
            id: 'pago-uuid-1',
            amount: mockRequest.amount,
            month: mockRequest.month,
            year: mockRequest.year,
            due_date: mockRequest.due_date,
            member_id: mockRequest.member_id,
            status: 'Pending'
        } as any);

        const result = await useCase.execute(mockRequest);

        expect(mockPaymentValidator.validateCreate).toHaveBeenCalledWith(mockRequest);
        expect(mockPaymentRepo.create).toHaveBeenCalledWith(mockRequest);
        expect(result.id).toBe('pago-uuid-1');
        expect(result.status).toBe('Pending');
    });

    it('no debe llamar al repositorio si el validador frena la ejecución por error de negocio', async () => {
        const mockRequest: CreatePaymentRequest = {
            amount: -100,
            month: 5,
            year: 2026,
            due_date: '2026-06-10',
            member_id: 'socio-valido-uuid'
        };

        vi.mocked(mockPaymentValidator.validateCreate).mockRejectedValueOnce(new Error('El monto debe ser mayor a cero'));

        await expect(useCase.execute(mockRequest)).rejects.toThrow('El monto debe ser mayor a cero');

        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });
});