import { PaymentRepository } from '../domain/PaymentsRepository.ts';
import { MemberRepository } from '../domain/MemberRepository.ts';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly memberRepository: MemberRepository
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {
        // 1. Validaciones
        if (!data.amount || !data.month || !data.year || !data.due_date || !data.member_id) {
            throw new Error('Faltan campos obligatorios');
        }
        if (data.amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
        if (data.month < 1 || data.month > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }
        const memberExists = await this.memberRepository.findById(data.member_id);
        if (!memberExists) {
            throw new Error('Socio no encontrado');
        }

        // 2. Persistencia: Si pasa todo, se manda al repositorio
        return await this.paymentRepository.create(data);
    }
}