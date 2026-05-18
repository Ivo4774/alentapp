import { PaymentRepository } from "../../domain/PaymentRepository.js";
import { PaymentDTO, GetPaymentsQuery } from '@alentapp/shared';

export class GetPaymentsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(filters?: GetPaymentsQuery): Promise<PaymentDTO[]> {
    const payments = await this.paymentRepository.findAll(filters);
    
    return payments;
  }
}