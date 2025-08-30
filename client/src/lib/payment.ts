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

export function formatPhoneNumber(phone: string, paymentMethod?: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle full country codes
  if (digits.startsWith('25261') || digits.startsWith('25263')) {
    return digits;
  }
  // Handle legacy Somalia country code (252)
  else if (digits.startsWith('252')) {
    return digits;
  } 
  
  // Context-aware formatting based on payment method
  if (paymentMethod) {
    if (paymentMethod === 'zaad') {
      // ZAAD is Somaliland service - use 25263
      if (digits.startsWith('6')) {
        return '25263' + digits;
      }
      else if (digits.startsWith('06')) {
        return '25263' + digits.substring(1);
      }
    } else if (paymentMethod === 'evc' || paymentMethod === 'edahab') {
      // EVC Plus and eDahab are Somalia services - use 25261
      if (digits.startsWith('9')) {
        return '25261' + digits;
      }
      else if (digits.startsWith('09')) {
        return '25261' + digits.substring(1);
      }
    }
  }
  
  // Fallback: Default behavior without context
  if (digits.startsWith('6') || digits.startsWith('06')) {
    const cleanDigits = digits.startsWith('06') ? digits.substring(1) : digits;
    return '25263' + cleanDigits; // Default Somaliland for 6x numbers
  }
  if (digits.startsWith('9') || digits.startsWith('09')) {
    const cleanDigits = digits.startsWith('09') ? digits.substring(1) : digits;
    return '25261' + cleanDigits; // Default Somalia for 9x numbers
  }
  
  return digits;
}

export function validatePhoneNumber(phone: string, paymentMethod?: string): boolean {
  const formatted = formatPhoneNumber(phone, paymentMethod);
  
  // Somalia mobile numbers: 25261 + 8 digits = 13 digits total
  // Somaliland mobile numbers: 25263 + 8 digits = 13 digits total
  const isValidSomalia = /^25261[69]\d{7}$/.test(formatted);
  const isValidSomaliland = /^25263[69]\d{7}$/.test(formatted);
  
  // Legacy 252 support (11 digits)
  const isValidLegacy = /^252[69]\d{7}$/.test(formatted);
  
  if (isValidSomalia || isValidSomaliland) {
    const carrierCode = formatted.substring(5, 7); // Adjusted for new format
    
    // Common carrier codes:
    // 90, 91, 92 - Hormuud (EVC Plus)
    // 60, 61, 62, 63 - Telesom (ZAAD), Somtel
    const validCodes = ['90', '91', '92', '60', '61', '62', '63', '65', '66', '67'];
    return validCodes.some(code => carrierCode.startsWith(code[0]) || carrierCode === code);
  }
  
  // Legacy validation for backward compatibility
  if (isValidLegacy) {
    const carrierCode = formatted.substring(3, 5);
    const validCodes = ['90', '91', '92', '60', '61', '62', '63', '65', '66', '67'];
    return validCodes.some(code => carrierCode.startsWith(code[0]) || carrierCode === code);
  }
  
  return false;
}

// Helper function to get carrier name from phone number
export function getCarrierFromPhone(phone: string, paymentMethod?: string): string {
  const formatted = formatPhoneNumber(phone, paymentMethod);
  if (!validatePhoneNumber(phone, paymentMethod)) return 'Unknown';
  
  // Determine country and carrier
  let country = '';
  let carrierCode = '';
  
  if (formatted.startsWith('25261')) {
    country = 'Somalia';
    carrierCode = formatted.substring(5, 7);
  } else if (formatted.startsWith('25263')) {
    country = 'Somaliland';
    carrierCode = formatted.substring(5, 7);
  } else if (formatted.startsWith('252')) {
    country = 'Somalia/Somaliland';
    carrierCode = formatted.substring(3, 5);
  }
  
  let carrier = '';
  if (carrierCode.startsWith('9')) {
    carrier = 'Hormuud (EVC Plus)';
  } else if (carrierCode.startsWith('6')) {
    carrier = 'Telesom/Somtel (ZAAD)';
  } else {
    carrier = 'Mobile Carrier';
  }
  
  return country ? `${carrier} - ${country}` : carrier;
}

// Generate USSD code for payment
export function generateUSSDCode(paymentMethod: string, recipientPhone: string, amount: number): string {
  const formattedAmount = amount.toFixed(1); // Ensure one decimal place
  
  switch (paymentMethod) {
    case 'evc':
      // EVC Plus USSD: *770*recipientPhone*amount#
      return `*770*${recipientPhone}*${formattedAmount}#`;
    case 'zaad':
      // ZAAD USSD: *880*recipientPhone*amount#  
      return `*880*${recipientPhone}*${formattedAmount}#`;
    case 'edahab':
      // eDahab USSD: *384*recipientPhone*amount#
      return `*384*${recipientPhone}*${formattedAmount}#`;
    default:
      return `*${recipientPhone}*${formattedAmount}#`;
  }
}

// Open phone dialer with USSD code
export function openUSSDDialer(ussdCode: string): void {
  // For mobile devices, open the phone dialer with the USSD code
  const telUrl = `tel:${encodeURIComponent(ussdCode)}`;
  window.open(telUrl, '_self');
}

// Get merchant phone number for payment method with correct country code
export function getMerchantPhone(paymentMethod: string): string {
  // These would be your actual merchant phone numbers for each service
  switch (paymentMethod) {
    case 'evc':
      return '25261634844506'; // Somalia EVC merchant number
    case 'zaad':
      return '25263634844506'; // Somaliland ZAAD merchant number  
    case 'edahab':
      return '25261634844506'; // Somalia eDahab merchant number
    default:
      return '25261634844506';
  }
}

// Process USSD payment - simplified version that just generates the code
export async function processUSSDPayment(data: {
  courseId: string;
  phone: string;
  amount: number;
  paymentMethod: string;
}): Promise<{ ussdCode: string; merchantPhone: string }> {
  const merchantPhone = getMerchantPhone(data.paymentMethod);
  const ussdCode = generateUSSDCode(data.paymentMethod, merchantPhone, data.amount);
  
  return {
    ussdCode,
    merchantPhone
  };
}
