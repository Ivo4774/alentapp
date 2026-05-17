import { CreatePaymentRequest, PaymentDTO, PaymentStatus } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida" para los Pagos.
export interface PaymentRepository {
  create(data: CreatePaymentRequest): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  findAll(): Promise<PaymentDTO[]>;
  findByMemberId(memberId: string): Promise<PaymentDTO[]>;
  updateStatus(id: string, status: PaymentStatus, paymentDate: Date): Promise<PaymentDTO>;
  cancel(id: string): Promise<PaymentDTO>;
}