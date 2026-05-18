import type { MedicalCertificateDTO, CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const medicalCertificatesService = {
  // GET: Obtener TODOS los certificados médicos del sistema (para la tabla global)
  async getAll(): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates`);
    if (!response.ok) {
      throw new Error('Error al obtener los certificados médicos');
    }
    const result = await response.json();
    return result.data;
  },

  // GET: Obtener certificados de un socio específico
  async getByMember(memberId: string): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates/member/${memberId}`);
    if (!response.ok) {
      throw new Error('Error al obtener los certificados médicos del miembro');
    }
    const result = await response.json();
    return result.data;
  },

  // POST: Crear un nuevo certificado mandando todo como JSON (evita el error 415 de Fastify)
  async create(data: CreateMedicalCertificateRequest & { file_data?: string | null }): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el certificado médico');
    }
    const result = await response.json();
    return result.data;
  },

  // PATCH: Modificar un certificado (activar/inactivar o cambiar datos)
  async update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el certificado médico');
    }
    const result = await response.json();
    return result.data;
  },

  // DELETE: Borrado físico del certificado
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el certificado médico');
    }
  },
};