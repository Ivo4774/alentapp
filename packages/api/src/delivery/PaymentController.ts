import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/payments/NewPaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { CreatePaymentRequest } from '@alentapp/shared';

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
}