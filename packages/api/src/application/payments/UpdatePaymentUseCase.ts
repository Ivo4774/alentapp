import { PaymentRepository } from "../../domain/PaymentRepository.js";
import { PaymentDTO, PayPaymentRequest } from '@alentapp/shared';

export class PayPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository
    ) {}

    async execute(id: string, data: PayPaymentRequest): Promise<PaymentDTO> {
        // 1. Validaciones especificadas en la TDD
        if (!data.payment_date || data.payment_date.trim() === '') {
            throw new Error('La fecha de pago es obligatoria');
        }

        const existingPayment = await this.paymentRepo.findById(id);
        if (!existingPayment) {
            throw new Error('Pago no encontrado');
        }

        if (existingPayment.status === 'Paid') {
            throw new Error('El pago ya fue registrado como pagado');
        }

        if (existingPayment.status === 'Canceled') {
            throw new Error('No se puede pagar un registro cancelado');
        }

        // 2. Si pasa las validaciones, se persiste
        const domainPaymentDate = new Date(data.payment_date);
        return await this.paymentRepo.updateStatus(id, 'Paid', domainPaymentDate);
    }
}