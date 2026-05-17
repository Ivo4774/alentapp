import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly lockerValidator: LockerValidator,
        private readonly memberRepo: MemberRepository
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Verificar existencia del casillero
        const existingLocker = await this.lockerRepo.findById(id);
        if (!existingLocker) {
            throw new Error('El casillero no existe'); 
        }

        // 2. Validar duplicidad del Número si cambió
        if (data.number !== undefined && data.number !== existingLocker.number) {
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        // --- REGLAS ESTRICTAS DEL TDD-0011 ---
        const finalStatus = data.status !== undefined ? data.status : existingLocker.status;
        const finalMemberId = data.member_id !== undefined ? data.member_id : existingLocker.member_id;

        // Regla: Bloquear asignación si está en mantenimiento
        if (finalStatus === 'Maintenance' && finalMemberId) {
            throw new Error('No se puede asignar un casillero en mantenimiento'); // Texto exacto del TDD
        }

        // Regla: Si está ocupado, debe tener socio y éste debe existir
        if (finalStatus === 'Occupied') {
            if (!finalMemberId) {
                throw new Error('Datos de actualización inválidos'); // Lo mapeamos al 400 del TDD
            }

            const memberExists = await this.memberRepo.findById(finalMemberId);
            if (!memberExists) {
                throw new Error('El socio referenciado no existe'); // Texto exacto del TDD
        
            }
            const lockerWithSameMember = await this.lockerRepo.findByMemberId(finalMemberId);
            if (lockerWithSameMember && lockerWithSameMember.id !== id) {
                throw new Error('El socio ya tiene un casillero asignado');
            }
        }

        // Regla: Si pasa a Disponible, nos aseguramos de que se limpie el socio
        let finalData = { ...data };
        if (finalStatus === 'Available') {
            finalData.member_id = null;
        }
        return await this.lockerRepo.update(id, finalData);
}
}