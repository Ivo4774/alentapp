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