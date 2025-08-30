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
  
  // Handle full country codes
  if (digits.startsWith('25261') || digits.startsWith('25263')) {
    return digits;
  }
  // Handle legacy Somalia country code (252) - default to Somalia
  else if (digits.startsWith('252')) {
    return digits;
  } 
  // Handle local numbers starting with 6 (Somaliland) - add 25263
  else if (digits.startsWith('6')) {
    return '25263' + digits;
  }
  // Handle local numbers starting with 9 (Somalia) - add 25261  
  else if (digits.startsWith('9')) {
    return '25261' + digits;
  }
  // Handle numbers starting with 0 (remove the 0)
  else if (digits.startsWith('06')) {
    return '25263' + digits.substring(1);
  }
  else if (digits.startsWith('09')) {
    return '25261' + digits.substring(1);
  }
  
  return digits;
}

export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  
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
export function getCarrierFromPhone(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (!validatePhoneNumber(phone)) return 'Unknown';
  
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

// Get merchant phone number for payment method
export function getMerchantPhone(paymentMethod: string): string {
  // These would be your actual merchant phone numbers for each service
  switch (paymentMethod) {
    case 'evc':
      return '634844506'; // Example EVC merchant number
    case 'zaad':
      return '634844506'; // Example ZAAD merchant number  
    case 'edahab':
      return '634844506'; // Example eDahab merchant number
    default:
      return '634844506';
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
