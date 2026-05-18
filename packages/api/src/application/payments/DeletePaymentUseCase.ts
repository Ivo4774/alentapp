import { PaymentRepository } from "../../domain/PaymentRepository.js";
import { PaymentDTO } from '@alentapp/shared';

export class CancelPaymentUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(id: string): Promise<PaymentDTO> {
        // 1. Validaciones especificadas en la TDD
        const existingPayment = await this.paymentRepo.findById(id);
        if (!existingPayment) {
            throw new Error('Payment not found');
        }

        if (existingPayment.status === 'Paid') {
            throw new Error('Cannot cancel a payment that is already paid');
        }

        if (existingPayment.status === 'Canceled') {
            throw new Error('Payment is already canceled');
        }

        // 2. Ejecutar la lógica
        return await this.paymentRepo.cancel(id);
    }
}