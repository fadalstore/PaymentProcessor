import { apiRequest } from "./queryClient";

export interface PaymentData {
  courseId: string;
  phone: string;
  amount: string;
  paymentMethod: string;
}

export interface PaymentResponse {
  payment: {
    id: string;
    status: string;
    transactionId?: string;
  };
  success: boolean;
  message: string;
}

export async function processPayment(data: PaymentData): Promise<PaymentResponse> {
  const response = await apiRequest("POST", "/api/payments", data);
  return response.json();
}

export async function checkPaymentStatus(paymentId: string) {
  const response = await apiRequest("GET", `/api/payments/${paymentId}`);
  return response.json();
}

export async function checkCourseAccess(courseId: string, phone: string) {
  const response = await apiRequest("GET", `/api/access/${courseId}/${phone}`);
  return response.json();
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Ensure it starts with 252 (Somalia country code)
  if (digits.startsWith('252')) {
    return digits;
  } else if (digits.startsWith('6') || digits.startsWith('9')) {
    return '252' + digits;
  }
  
  return digits;
}

export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Somalia numbers: 252 + 8 or 9 digits
  return /^252[69]\d{7}$/.test(formatted);
}
