import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {
        await this.paymentValidator.validateCreate(data);
        return await this.paymentRepository.create(data);
    }
}