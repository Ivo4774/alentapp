import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../../application/payments/NewPaymentUseCase.js';
import { PayPaymentUseCase } from '../../application/payments/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from '../../application/payments/DeletePaymentUseCase.js';
import { GetPaymentsUseCase } from '../../application/payments/GetPaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { CreatePaymentRequest, PayPaymentRequest, GetPaymentsQuery } from '@alentapp/shared';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('alentapp-api');
const requestCounter = meter.createCounter('http.requests.total');
const errorCounter = meter.createCounter('http.requests.errors');
const requestDuration = meter.createHistogram('http.request.duration', { unit: 'ms' });

export class PaymentController {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  // Handler para GET /api/v1/payments (Listar todos los pagos con filtros opcionales)
  async getAll(request: FastifyRequest<{ Querystring: GetPaymentsQuery }>, reply: FastifyReply) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];

    try {
      const getPaymentsUseCase = new GetPaymentsUseCase(this.paymentRepository);
      const filterQuery = request.query;
      const payments = await getPaymentsUseCase.execute(filterQuery);
      requestCounter.add(1, { method, route, status: '200' });
      return reply.status(200).send({ data: payments });
    } catch (error: any) {
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: error.message || 'Error interno del servidor' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
    }
  }

  // 1. Handler para POST /api/v1/payments (Crear un pago)
  async create(request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];

    try {
      const paymentValidator = new PaymentValidator(this.paymentRepository, this.memberRepository);
      
      const createPaymentUseCase = new CreatePaymentUseCase(
        this.paymentRepository,
        paymentValidator
      );

      const newPayment = await createPaymentUseCase.execute(request.body);
      requestCounter.add(1, { method, route, status: '201' });
      return reply.status(201).send({ data: newPayment });
    } catch (error: any) {
      if (
        error.message === 'Faltan campos obligatorios' || 
        error.message === 'El monto debe ser mayor a cero' || 
        error.message === 'El mes debe estar entre 1 y 12' ||
        error.message === 'La fecha de vencimiento no puede ser menor al período de referencia'
      ) {
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ error: error.message });
      }

      if (error.message === 'Socio no encontrado') {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }

      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Error al procesar el registro del pago' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
    }
  }

  // 2. Handler para PATCH /api/v1/payments/:id/pay (Registrar Pago Efectivo)
  async pay(request: FastifyRequest<{ Params: { id: string }; Body: PayPaymentRequest }>, reply: FastifyReply) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];

    try {
      const paymentValidator = new PaymentValidator(this.paymentRepository, this.memberRepository);
      const payPaymentUseCase = new PayPaymentUseCase(this.paymentRepository, paymentValidator);

      const { id } = request.params;
      const updatedPayment = await payPaymentUseCase.execute(id, request.body);

      requestCounter.add(1, { method, route, status: '200' });
      return reply.status(200).send({ data: updatedPayment });
    } catch (error: any) {
      if (error.message === 'La fecha de pago es obligatoria') {
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === 'Pago no encontrado') {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }
      if (
        error.message === 'El pago ya fue registrado como pagado' || 
        error.message === 'No se puede pagar un registro cancelado'
      ) {
        errorCounter.add(1, { method, route, status: '409' });
        return reply.status(409).send({ error: error.message });
      }
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Error interno, por favor intente mas tarde' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
    }
  }

  // 3. Handler para DELETE /api/v1/payments/:id/cancel (Anular Pago)
  async cancel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];

    try {
      const paymentValidator = new PaymentValidator(this.paymentRepository, this.memberRepository);
      const cancelPaymentUseCase = new CancelPaymentUseCase(this.paymentRepository, paymentValidator);
      const { id } = request.params;

      await cancelPaymentUseCase.execute(id);
      requestCounter.add(1, { method, route, status: '204' });
      return reply.status(204).send(); 
    } catch (error: any) {
      if (error.message === 'Pago no encontrado') {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }
      if (
        error.message === 'No se puede anular un pago ya pagado' ||
        error.message === 'El pago ya ha sido anulado'
      ) {
        errorCounter.add(1, { method, route, status: '409' });
        return reply.status(409).send({ error: error.message });
      }
      errorCounter.add(1, { method, route, status: '400' });
      return reply.status(400).send({ error: error.message || 'Error al procesar la anulación' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
    }
  }
}