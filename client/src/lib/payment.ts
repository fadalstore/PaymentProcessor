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
  
  // Handle Somalia country code (252)
  if (digits.startsWith('252')) {
    return digits;
  } 
  // Handle local numbers starting with 6 or 9 (common in Somalia/Somaliland)
  else if (digits.startsWith('6') || digits.startsWith('9')) {
    return '252' + digits;
  }
  // Handle numbers starting with 0 (remove the 0 and add 252)
  else if (digits.startsWith('0') && (digits.startsWith('06') || digits.startsWith('09'))) {
    return '252' + digits.substring(1);
  }
  
  return digits;
}

export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  
  // Somalia/Somaliland mobile numbers:
  // 252 + 6XXXXXXX (Somtel, Telesom/Zaad in Somaliland)
  // 252 + 9XXXXXXX (Hormuud/EVC in Somalia)
  // Total: 252 + 8 digits = 11 digits
  const isValidSomalia = /^252[69]\d{7}$/.test(formatted);
  
  // Additional validation for specific carriers
  if (isValidSomalia) {
    const carrierCode = formatted.substring(3, 5);
    
    // Common carrier codes:
    // 90, 91, 92 - Hormuud (EVC Plus)
    // 60, 61, 62, 63 - Telesom (ZAAD), Somtel
    const validCodes = ['90', '91', '92', '60', '61', '62', '63', '65', '66', '67'];
    return validCodes.some(code => carrierCode.startsWith(code[0]) || carrierCode === code);
  }
  
  return false;
}

// Helper function to get carrier name from phone number
export function getCarrierFromPhone(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (!validatePhoneNumber(phone)) return 'Unknown';
  
  const carrierCode = formatted.substring(3, 5);
  
  if (carrierCode.startsWith('9')) return 'Hormuud (EVC Plus)';
  if (carrierCode.startsWith('6')) return 'Telesom/Somtel (ZAAD)';
  
  return 'Mobile Carrier';
}
