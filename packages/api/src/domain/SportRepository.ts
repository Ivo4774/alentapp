import { SportDTO, UpdateSportRequest } from "@alentapp/shared";

export interface SportRepository {
    create(sport: Omit<SportDTO, 'id' | 'created_at'>): Promise<SportDTO>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<SportDTO | null>;
    findByName(name: string): Promise<SportDTO | null>;
    findAll(): Promise<SportDTO[]>;
}