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
// Payment
// ==========================================
export type PaymentStatus = 'Pending' | 'Paid' | 'Canceled';

export interface PaymentDTO {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  due_date: string;       // ISO Date String
  payment_date: string | null; // ISO Date String
  member_id: string;
}

export interface CreatePaymentRequest {
  amount: number;
  month: number;
  year: number;
  due_date: string;       // ISO Date String (YYYY-MM-DD)
  member_id: string;
}

export interface PayPaymentRequest {
  payment_date: string;   // ISO Date String (YYYY-MM-DD)
}

export interface CancelPaymentRequest {
  // Vacío ya que la anulación lógica solo cambia el status a 'Canceled'
  // y setea la fecha de pago en null, pero sirve para tipar el controlador.
}

export interface GetPaymentsQuery {
  query?: string; 
  status?: PaymentStatus;
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
