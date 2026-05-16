import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBLocker = {
    id: string;
    number: number;
    location: string;
    status: 'Available' | 'Occupied' | 'Maintenance';
    member_id: string | null;
    created_at: Date;
    updated_at: Date;
};

export class PostgresLockerRepository implements LockerRepository {
    async create(data: Omit<LockerDTO, 'id'>): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                number: data.number,
                location: data.location,
                status: data.status,
                member_id: data.member_id,
                // created_at y updated_at las maneja Prisma automáticamente por el @default(now()) y @updatedAt
            },
        });

        return this.mapToDTO(locker);
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByNumber(number: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { number }, // Este es el método clave que usa tu LockerValidator
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            orderBy: { number: 'asc' }, // A diferencia de los socios, los lockers conviene ordenarlos por número
        });

        return lockers.map(this.mapToDTO);
    }

    async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.update({
            where: { id },
            data: {
                // Usamos !== undefined para permitir que member_id pueda setearse en null (cuando se vacía el casillero)
                ...(data.number !== undefined && { number: data.number }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.member_id !== undefined && { member_id: data.member_id }),
            },
        });

        return this.mapToDTO(locker);
    }

    async delete(id: string): Promise<void> {
        await prisma.locker.delete({
            where: { id },
        });
    }

    // Centralizamos el mapeo para que siempre coincida con el contrato del Frontend
    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id,
            created_at: locker.created_at.toISOString(),
            updated_at: locker.updated_at.toISOString(),
        };
    }
}