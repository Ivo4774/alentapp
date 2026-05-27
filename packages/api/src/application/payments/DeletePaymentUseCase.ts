import { PaymentRepository } from "../../domain/PaymentRepository.js";
import { PaymentDTO } from '@alentapp/shared';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';

export class CancelPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(id: string): Promise<PaymentDTO> {
        await this.paymentValidator.validateCancel(id);
        return await this.paymentRepo.cancel(id);
    }
}