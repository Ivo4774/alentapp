// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}

// ==========================================
// Sport
// ==========================================
export interface SportDTO{
  id: string; //UUID
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
  created_at?: string;
}

export interface CreateSportRequest {
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

export interface UpdateSportRequest {
  description?: string;
  max_capacity?: number;
}

// ==========================================
// Locker
// ==========================================
export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface LockerDTO {
  id: string; // UUID
  number: number;
  location: string;
  status: LockerStatus;
  member_id: string | null; // UUID del socio asignado, null si está libre
  created_at: string; // ISO Date String
  updated_at: string; // ISO Date String
}

export interface CreateLockerRequest {
  number: number; // Ingresado manualmente por regla de negocio 
  location: string;
}

export interface UpdateLockerRequest {
  number?: number;
  location?: string;
  status?: LockerStatus;
  member_id?: string | null;
}

// ==========================================
// Medical Certificate
// ==========================================
export interface MedicalCertificateDTO {
  id: string;               // UUID
  issue_date: string;       // ISO 8601: "YYYY-MM-DD"
  expiry_date: string;      // ISO 8601: "YYYY-MM-DD"
  doctor_license: string;   // Matrícula profesional
  is_validated: boolean;    // Estado de vigencia
  member_id: string;
}

export interface CreateMedicalCertificateRequest {
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  member_id: string;
}

export interface UpdateMedicalCertificateRequest {
  issue_date?: string;
  expiry_date?: string;
  doctor_license?: string;
  is_validated?: boolean;
}
