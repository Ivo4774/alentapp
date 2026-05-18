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
