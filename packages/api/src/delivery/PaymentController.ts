import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/payments/NewPaymentUseCase.js';
import { PayPaymentUseCase } from '../application/payments/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from '../application/payments/DeletePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { CreatePaymentRequest, PayPaymentRequest } from '@alentapp/shared';

export class PaymentController {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  // Handler para GET /api/v1/payments (Listar todos los pagos)
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payments = await this.paymentRepository.findAll();
      return reply.status(200).send({ data: payments });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Error interno del servidor' });
    }
  }

  // Handler para POST /api/v1/payments (Crear un pago)
  async create(request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) {
    try {
      const createPaymentUseCase = new CreatePaymentUseCase(
        this.paymentRepository,
        this.memberRepository
      );

      const newPayment = await createPaymentUseCase.execute(request.body);
      return reply.status(201).send({ data: newPayment });
    } catch (error: any) {
      if (
        error.message === 'Faltan campos obligatorios' || 
        error.message === 'El monto debe ser mayor a cero' || 
        error.message === 'El mes debe estar entre 1 y 12'
      ) {
        return reply.status(400).send({ error: error.message });
      }

      if (error.message === 'Socio no encontrado') {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'Error al procesar el registro del pago' });
    }
  }

  // 2. Handler para PATCH /api/v1/payments/:id/pay (Registrar Pago Efectivo)
  async pay(
    request: FastifyRequest<{ Params: { id: string }; Body: PayPaymentRequest }>, 
    reply: FastifyReply
  ) {
    try {
      const payPaymentUseCase = new PayPaymentUseCase(this.paymentRepository);

      const { id } = request.params;
      const updatedPayment = await payPaymentUseCase.execute(id, request.body);

      return reply.status(200).send({ data: updatedPayment });
    } catch (error: any) {
      if (error.message === 'La fecha de pago es obligatoria') {
        return reply.status(400).send({ error: error.message });
      }

      if (error.message === 'Pago no encontrado') {
        return reply.status(404).send({ error: error.message });
      }

      if (
        error.message === 'El pago ya fue registrado como pagado' || 
        error.message === 'No se puede pagar un registro cancelado'
      ) {
        return reply.status(409).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
    }
  }

// 3. Handler para DELETE /api/v1/payments/:id/cancel (Anular Pago)
  async cancel(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const cancelPaymentUseCase = new CancelPaymentUseCase(this.paymentRepository);
      const { id } = request.params;

      await cancelPaymentUseCase.execute(id);
      
      return reply.status(204).send(); 
    } catch (error: any) {
      if (error.message === 'Pago no encontrado') {
        return reply.status(404).send({ error: error.message });
      }

      if (
        error.message === 'No se puede anular un pago ya pagado' ||
        error.message === 'El pago ya ha sido anulado'
      ) {
        return reply.status(409).send({ error: error.message });
      }

      return reply.status(400).send({ error: error.message || 'Error al procesar la anulación' });
    }
  }
}