import { PaymentRepository } from "../PaymentRepository.js";
import { MemberRepository } from "../MemberRepository.js";
import { CreatePaymentRequest } from '@alentapp/shared';

export class PaymentValidator {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepository: MemberRepository
    ) {}

    /* Validaciones estructurales y de negocio para la creación de un pago */
    async validateCreate(data: CreatePaymentRequest): Promise<void> {
        if (!data.amount || !data.month || !data.year || !data.due_date || !data.member_id) {
            throw new Error('Faltan campos obligatorios');
        }
        if (data.amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
        if (data.month < 1 || data.month > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }

        const vencimiento = new Date(data.due_date);
        const inicioPeriodo = new Date(data.year, data.month - 1, 1);

        if (vencimiento < inicioPeriodo) {
            throw new Error('La fecha de vencimiento no puede ser menor al período de referencia');
        }

        const memberExists = await this.memberRepository.findById(data.member_id);
        if (!memberExists) {
            throw new Error('Socio no encontrado');
        }
    }

    /* Validaciones para registrar la transacción de pago efectiva */
    async validatePay(id: string, paymentDate?: string): Promise<void> {
        if (!paymentDate || paymentDate.trim() === '') {
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
    }

    /* Validaciones para la anulación de un pago */
    async validateCancel(id: string): Promise<void> {
        const existingPayment = await this.paymentRepo.findById(id);
        if (!existingPayment) {
            throw new Error('Pago no encontrado');
        }
        if (existingPayment.status === 'Paid') {
            throw new Error('No se puede anular un pago ya pagado');
        }
        if (existingPayment.status === 'Canceled') {
            throw new Error('El pago ya ha sido anulado');
        }
    }
}