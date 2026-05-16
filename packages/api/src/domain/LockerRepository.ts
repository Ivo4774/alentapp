import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';



export interface LockerRepository {
  create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO>;
  findById(id: string): Promise<LockerDTO | null>;
  findByNumber(number: number): Promise<LockerDTO | null>; // Clave para la validación de unicidad
  findAll(): Promise<LockerDTO[]>;
  update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>;
  delete(id: string): Promise<void>;
}