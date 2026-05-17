import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js'; 
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { CreatePaymentRequest, PaymentDTO, PaymentStatus, GetPaymentsQuery } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBPayment = {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: 'Pending' | 'Paid' | 'Canceled';
    due_date: Date;
    payment_date: Date | null;
    member_id: string;
    created_at: Date;
};

export class PostgresPaymentRepository implements PaymentRepository {
    constructor() {}

    async create(data: CreatePaymentRequest): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
            data: {
                amount: data.amount,
                month: data.month,
                year: data.year,
                due_date: new Date(data.due_date),
                status: 'Pending',
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(payment as DBPayment);
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        return payment ? this.mapToDTO(payment as DBPayment) : null;
    }

    async findAll(filters?: GetPaymentsQuery): Promise<PaymentDTO[]> {
        const whereClause: any = {};

        if (filters) {
            if (filters.status) {
                whereClause.status = filters.status;
            }

            if (filters.query) {
                whereClause.OR = [
                    {
                        member: {
                            name: { contains: filters.query, mode: 'insensitive' }
                        }
                    },
                    {
                        member: {
                            dni: { contains: filters.query, mode: 'insensitive' }
                        }
                    }
                ];
            }
        }

        const payments = await prisma.payment.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
        });

        return (payments as DBPayment[]).map(p => this.mapToDTO(p));
    }

    async findByMemberId(memberId: string): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            where: { member_id: memberId },
        });

        return payments.map(this.mapToDTO);
    }

    async updateStatus(id: string, status: PaymentStatus, paymentDate: Date): Promise<PaymentDTO> {
        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status,
                payment_date: paymentDate,
            },
        });

        return this.mapToDTO(payment as DBPayment);
    }

    async cancel(id: string): Promise<PaymentDTO> {
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
            status: 'Canceled',
            payment_date: null,
            },
        });

        return this.mapToDTO(updatedPayment);
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            amount: payment.amount,
            month: payment.month,
            year: payment.year,
            status: payment.status as PaymentStatus,
            due_date: payment.due_date.toISOString().split('T')[0], // 'YYYY-MM-DD'
            payment_date: payment.payment_date ? payment.payment_date.toISOString().split('T')[0] : null,
            member_id: payment.member_id,
        };
    }
}