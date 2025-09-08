import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Course } from "@shared/schema";
import { type Language, getTranslation } from "@/lib/i18n";
import { processUSSDPayment, formatPhoneNumber, validatePhoneNumber, getCarrierFromPhone, openUSSDDialer, generateUSSDCode, getMerchantPhone, maskUSSDCode } from "@/lib/payment";

// Get country code prefix based on payment method
function getCountryPrefix(paymentMethod: string): string {
  switch (paymentMethod) {
    case 'zaad':
      return '25263'; // Somaliland
    case 'evc':
    case 'edahab':
      return '25261'; // Somalia
    default:
      return '252'; // Default
  }
}

// Get placeholder text based on payment method
function getPhonePlaceholder(paymentMethod?: string): string {
  if (!paymentMethod) return "Gali lambarka telefoonka";
  
  switch (paymentMethod) {
    case 'zaad':
      return "25263634567890 (ZAAD - Somaliland)";
    case 'evc':
      return "25261615123456 (EVC Plus - Somalia)";
    case 'edahab':
      return "25261615123456 (eDahab - Somalia)";
    default:
      return "Gali lambarka telefoonka";
  }
}
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, Wallet, DollarSign, CheckCircle, Download } from "lucide-react";
import { CardPaymentForm } from "@/components/CardPaymentForm";
import { StripeProvider, isStripeEnabled } from "@/components/StripeProvider";

const paymentSchema = z.object({
  phone: z.string()
    .min(8, "Phone number is required").optional(),
  paymentMethod: z.enum(["evc", "zaad", "edahab", "card"], {
    required_error: "Please select a payment method"
  })
});

const cardPaymentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  paymentMethod: z.literal("card")
});

type PaymentFormData = z.infer<typeof paymentSchema>;
type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  language: Language;
}

type PaymentStep = 'details' | 'ussd-instructions' | 'card-payment' | 'success' | 'error';

export function PaymentModal({ isOpen, onClose, course, language }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentId, setPaymentId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [ussdCode, setUSSDCode] = useState<string>("");
  const { toast } = useToast();
  const t = getTranslation(language);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      phone: "",
      paymentMethod: undefined
    },
    mode: "onChange"
  });
  
  const selectedPaymentMethod = form.watch('paymentMethod');
  
  // Custom validation that considers payment method
  const validatePhoneWithContext = (phone: string) => {
    if (!phone || phone.length < 8) return false;
    return validatePhoneNumber(phone, selectedPaymentMethod || 'evc');
  };
  
  // Auto-reformat phone number when payment method changes
  useEffect(() => {
    const currentPhone = form.getValues().phone;
    if (selectedPaymentMethod && selectedPaymentMethod !== 'card' && currentPhone && currentPhone.length >= 8) {
      const reformatted = formatPhoneNumber(currentPhone, selectedPaymentMethod);
      if (reformatted !== currentPhone) {
        form.setValue('phone', reformatted);
        form.trigger('phone');
      }
    }
  }, [selectedPaymentMethod, form]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!course) return;

    // Handle card payment separately
    if (data.paymentMethod === 'card') {
      console.log('🔄 Switching to card payment step');
      setStep('card-payment');
      return;
    }

    // Handle mobile payments
    if (!data.phone) {
      toast({
        title: "Khalad",
        description: "Lambarka telefoonka waa loo baahan yahay",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(data.phone, data.paymentMethod);
      const merchantPhone = getMerchantPhone(data.paymentMethod);
      const ussdCode = generateUSSDCode(data.paymentMethod, merchantPhone, parseFloat(course.price));
      
      // Store the payment details for later verification
      setPaymentId(`USSD_${Date.now()}`);
      
      // Show USSD instructions step
      setStep('ussd-instructions');
      
      // Set the USSD code for display
      setUSSDCode(ussdCode);
      
    } catch (error) {
      setStep('error');
      setErrorMessage("Ma jiro khalad ku dhacay diyaarinta lacag-bixinta. Fadlan isku day mar kale.");
      toast({
        title: "Khalad",
        description: "Ma jiro khalad ku dhacay diyaarinta lacag-bixinta.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!course) return;
    
    const phone = form.getValues().phone;
    const paymentMethod = form.getValues().paymentMethod;
    
    if (phone && paymentMethod !== 'card') {
      const formattedPhone = formatPhoneNumber(phone, paymentMethod);
      const downloadUrl = `/api/download/${course.id}/${formattedPhone}`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${course.title[language].replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setStep('details');
    setPaymentId("");
    setErrorMessage("");
    form.reset();
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  const paymentMethods = [
    { id: 'evc', name: 'EVC Plus', icon: Smartphone, color: 'text-green-600' },
    { id: 'zaad', name: 'ZAAD', icon: Wallet, color: 'text-blue-600' },
    { id: 'edahab', name: 'eDahab', icon: DollarSign, color: 'text-orange-600' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-500' }
  ];

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-h-none glass-effect border-0 shadow-2xl" data-testid="payment-modal">
        {step === 'details' && (
          <>
            <DialogHeader>
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold mb-3 text-gradient bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {t.payment.title}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm sm:text-base">
                  {course.title[language]}
                </DialogDescription>
              </div>
            </DialogHeader>

            <Card className="p-4 sm:p-6 mb-4 sm:mb-6 glass-effect border-0 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base sm:text-lg">{t.payment.price}</span>
                <span className="text-2xl sm:text-3xl font-bold text-gradient bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  ${course.price}
                </span>
              </div>
            </Card>

            {/* Demo Mode Indicator */}
            <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                  {language === 'so' 
                    ? 'Demo Mode - Lacag dhabta lama qaadayo'
                    : language === 'ar'
                    ? 'وضع التجريب - لا يتم أخذ أموال حقيقية'
                    : 'Demo Mode - No real money charged'}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {language === 'so'
                  ? 'Markii API keys-ka la galiyo, lacag-bixinta dhab ah ayaa bilaaban doonta'
                  : language === 'ar' 
                  ? 'عند إدراج مفاتيح API، سيبدأ الدفع الحقيقي'
                  : 'Real payments will start once API keys are configured'}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {selectedPaymentMethod !== 'card' && (
                  <FormField
                    control={form.control}
                    name="phone"
                  rules={{
                    validate: (value) => {
                      if (!value || value.length < 8) {
                        return "Lambarka telefoonka waa lagama maarmaan";
                      }
                      if (!selectedPaymentMethod) {
                        return "Fadlan dooro hab lacag-bixin";
                      }
                      if (!validatePhoneWithContext(value)) {
                        return selectedPaymentMethod === 'zaad' 
                          ? "Lambar Somaliland oo sax ah gali (25263)" 
                          : "Lambar Somalia oo sax ah gali (25261)";
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.payment.phone}</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              placeholder={getPhonePlaceholder(selectedPaymentMethod)}
                              {...field}
                              data-testid="input-phone"
                              onChange={(e) => {
                                let inputValue = e.target.value;
                                
                                // Auto-format based on payment method selection
                                if (selectedPaymentMethod && inputValue.length >= 8 && !inputValue.startsWith('252')) {
                                  const prefix = getCountryPrefix(selectedPaymentMethod);
                                  if (!inputValue.startsWith(prefix)) {
                                    inputValue = formatPhoneNumber(inputValue, selectedPaymentMethod);
                                  }
                                }
                                
                                field.onChange(inputValue);
                                
                                // Show carrier info as user types
                                if (validatePhoneNumber(inputValue, selectedPaymentMethod)) {
                                  const carrier = getCarrierFromPhone(inputValue, selectedPaymentMethod);
                                  console.log(`Detected carrier: ${carrier}`);
                                }
                              }}
                            />
                            {selectedPaymentMethod && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {getCountryPrefix(selectedPaymentMethod)}
                                </span>
                              </div>
                            )}
                          </div>
                          {field.value && validatePhoneNumber(field.value, selectedPaymentMethod) && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {getCarrierFromPhone(field.value, selectedPaymentMethod)}
                            </p>
                          )}
                          {selectedPaymentMethod && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedPaymentMethod === 'zaad' 
                                ? "✓ ZAAD waxaa loo isticmaalaa Somaliland (25263)"
                                : "✓ EVC Plus/eDahab waxaa loo isticmaalaa Somalia (25261)"}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.payment.paymentMethod}</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          const isSelected = field.value === method.id;
                          const isCardMethod = method.id === 'card';
                          const isDisabled = isCardMethod && !isStripeEnabled;
                          
                          return (
                            <button
                              key={method.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                field.onChange(method.id);
                                // Auto-update phone number format when payment method changes
                                const currentPhone = form.getValues().phone;
                                if (currentPhone && currentPhone.length >= 8 && !isCardMethod) {
                                  const reformatted = formatPhoneNumber(currentPhone, method.id);
                                  form.setValue('phone', reformatted);
                                  form.trigger('phone');
                                }
                              }}
                              className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                                isDisabled
                                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary hover:bg-primary/5'
                              }`}
                              data-testid={`payment-method-${method.id}`}
                            >
                              <Icon className={`w-6 h-6 mb-2 ${isDisabled ? 'text-gray-400' : method.color}`} />
                              <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : ''}`}>
                                {method.name}
                              </span>
                              {isCardMethod && !isStripeEnabled && (
                                <span className="text-xs text-gray-400 mt-1">
                                  {language === 'so' ? 'La hagaajinayo' : 'Configuring'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-sm sm:text-base"
                    onClick={handleClose}
                    data-testid="button-cancel"
                  >
                    {t.payment.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base"
                    data-testid="button-pay"
                  >
                    {t.payment.pay} ${course.price}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {step === 'ussd-instructions' && (
          <div className="text-center py-4 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              {language === 'so' ? 'Lacag-bixinta hawlga' : 
               language === 'ar' ? 'تعليمات الدفع' : 
               'Payment Instructions'}
            </h3>
            
            {/* USSD Code Display */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {language === 'so' ? 'Code-kan garacsa teleefonka:' : 
                 language === 'ar' ? 'اطلب هذا الرمز على هاتفك:' : 
                 'Dial this code on your phone:'}
              </p>
              <p className="text-lg sm:text-2xl font-mono font-bold text-primary bg-white dark:bg-slate-900 p-2 sm:p-3 rounded border">
                {maskUSSDCode(ussdCode)}
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left mb-4 sm:mb-6 space-y-2 text-sm sm:text-base">
              <p className="font-medium">
                {language === 'so' ? 'Tillaabooyin:' : 
                 language === 'ar' ? 'الخطوات:' : 
                 'Steps:'}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  {language === 'so' ? 'Riix batoonka hoose si aad u wacdo' : 
                   language === 'ar' ? 'اضغط على الزر أدناه للاتصال' : 
                   'Press the button below to call'}
                </li>
                <li>
                  {language === 'so' ? 'Raac tillaabooyin screen-ka' : 
                   language === 'ar' ? 'اتبع التعليمات على الشاشة' : 
                   'Follow the on-screen instructions'}
                </li>
                <li>
                  {language === 'so' ? 'Gali password-kaaga' : 
                   language === 'ar' ? 'أدخل كلمة المرور الخاصة بك' : 
                   'Enter your PIN'}
                </li>
                <li>
                  {language === 'so' ? 'Xaqiiji lacag-bixinta' : 
                   language === 'ar' ? 'أكد الدفع' : 
                   'Confirm the payment'}
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 text-sm sm:text-base"
                data-testid="button-cancel-ussd"
              >
                {language === 'so' ? 'Jooji' : 
                 language === 'ar' ? 'إلغاء' : 
                 'Cancel'}
              </Button>
              <Button
                onClick={() => openUSSDDialer(ussdCode)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                data-testid="button-call-ussd"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                {language === 'so' ? 'Iibso Hadda' : 
                 language === 'ar' ? 'اشتري الآن' : 
                 'Buy Now'}
              </Button>
            </div>

            {/* Payment Completed Button */}
            <div className="mt-4">
              <Button
                onClick={() => setStep('success')}
                variant="outline"
                className="w-full text-sm"
                data-testid="button-payment-completed"
              >
                {language === 'so' ? 'Lacag-bixintii waa dhammeeyay' : 
                 language === 'ar' ? 'تم الدفع' : 
                 'Payment Completed'}
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                {language === 'so' ? 'Markii aad dhammeeyso lacag-bixinta, riix "Lacag-bixintii waa dhammeeyay"' : 
                 language === 'ar' ? 'بعد إتمام الدفع، اضغط على "تم الدفع"' : 
                 'After completing payment, click "Payment Completed"'}
              </p>
            </div>
          </div>
        )}

        {step === 'card-payment' && course && (
          <div>
            <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
              Debug: Card payment step active
            </div>
            <StripeProvider>
              <CardPaymentForm
                course={course}
                language={language}
                onSuccess={(paymentId) => {
                  setPaymentId(paymentId);
                  setStep('success');
                }}
                onError={(error) => {
                  setErrorMessage(error);
                  setStep('error');
                }}
              />
            </StripeProvider>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gradient bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {t.payment.success}
            </h3>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Koorsadaada waa diyaar u tahay soo dejinta
            </p>
            <Button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
              data-testid="button-download"
            >
              <Download className="w-5 h-5 mr-2" />
              {t.payment.download}
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gradient bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Payment Failed
            </h3>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-3 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
                data-testid="button-close"
              >
                Close
              </Button>
              <Button
                onClick={() => setStep('details')}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transform hover:scale-105 transition-all duration-300"
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
