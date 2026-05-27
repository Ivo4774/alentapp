import { PaymentRepository } from "../../domain/PaymentRepository.js";
import { PaymentDTO, PayPaymentRequest } from '@alentapp/shared';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';

export class PayPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(id: string, data: PayPaymentRequest): Promise<PaymentDTO> {
        await this.paymentValidator.validatePay(id, data.payment_date);
        
        const domainPaymentDate = new Date(data.payment_date);
        return await this.paymentRepo.updateStatus(id, 'Paid', domainPaymentDate);
    }
}