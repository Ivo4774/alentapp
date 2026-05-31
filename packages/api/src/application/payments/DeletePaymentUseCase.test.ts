import { describe, it, expect, vi } from 'vitest';
import { CancelPaymentUseCase } from './DeletePaymentUseCase.js';

describe('CancelPaymentUseCase', () => {
    
    it('debe cancelar un pago exitosamente si pasa las validaciones', async () => {
        const mockRepo = { cancel: vi.fn() } as any; 
        const mockValidator = { validateCancel: vi.fn().mockResolvedValue(undefined) } as any;
        
        const useCase = new CancelPaymentUseCase(mockRepo, mockValidator);
        const paymentId = 'pago-123';
        const expectedPayment = { id: paymentId, status: 'Canceled' };
        mockRepo.cancel.mockResolvedValue(expectedPayment);

        const result = await useCase.execute(paymentId);

        expect(mockValidator.validateCancel).toHaveBeenCalledWith(paymentId);
        expect(mockRepo.cancel).toHaveBeenCalledWith(paymentId);
        expect(result.status).toBe('Canceled');
    });

    it('debe propagar el error si la validación falla (ej: pago ya pagado)', async () => {
        const mockRepo = { cancel: vi.fn() } as any; 
        const mockValidator = { 
            validateCancel: vi.fn().mockRejectedValue(new Error('No se puede anular un pago ya pagado')) 
        } as any;
        
        const useCase = new CancelPaymentUseCase(mockRepo, mockValidator);

        await expect(useCase.execute('pago-123')).rejects.toThrow('No se puede anular un pago ya pagado');
        expect(mockRepo.cancel).not.toHaveBeenCalled();
    });
});