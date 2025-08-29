import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Course } from "@shared/schema";
import { type Language, getTranslation } from "@/lib/i18n";
import { processPayment, formatPhoneNumber, validatePhoneNumber, getCarrierFromPhone } from "@/lib/payment";
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

const paymentSchema = z.object({
  phone: z.string()
    .min(8, "Phone number is required")
    .refine(validatePhoneNumber, "Invalid Somalia phone number"),
  paymentMethod: z.enum(["evc", "zaad", "edahab"], {
    required_error: "Please select a payment method"
  })
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  language: Language;
}

type PaymentStep = 'details' | 'processing' | 'success' | 'error';

export function PaymentModal({ isOpen, onClose, course, language }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('details');
  const [paymentId, setPaymentId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();
  const t = getTranslation(language);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      phone: "",
      paymentMethod: undefined
    }
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (!course) return;

    setStep('processing');
    
    try {
      const formattedPhone = formatPhoneNumber(data.phone);
      const result = await processPayment({
        courseId: course.id,
        phone: formattedPhone,
        amount: course.price,
        paymentMethod: data.paymentMethod
      });

      setPaymentId(result.payment.id);

      if (result.success) {
        setStep('success');
        toast({
          title: t.payment.success,
          description: t.payment.download,
        });
      } else {
        setStep('error');
        setErrorMessage(result.message);
        toast({
          title: "Payment Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setStep('error');
      setErrorMessage("Payment processing failed. Please try again.");
      toast({
        title: "Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!course) return;
    
    const phone = formatPhoneNumber(form.getValues().phone);
    const downloadUrl = `/api/download/${course.id}/${phone}`;
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${course.id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
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
    { id: 'edahab', name: 'eDahab', icon: DollarSign, color: 'text-orange-600' }
  ];

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-h-none" data-testid="payment-modal">
        {step === 'details' && (
          <>
            <DialogHeader>
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold mb-2">
                  {t.payment.title}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm sm:text-base">
                  {course.title[language]}
                </DialogDescription>
              </div>
            </DialogHeader>

            <Card className="p-3 sm:p-4 mb-3 sm:mb-4 bg-secondary">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm sm:text-base">{t.payment.price}</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">
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
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.payment.phone}</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="252615123456 (Hormuud/EVC) ama 252634567890 (Telesom/ZAAD)"
                            {...field}
                            data-testid="input-phone"
                            onChange={(e) => {
                              field.onChange(e);
                              // Show carrier info as user types
                              const phone = e.target.value;
                              if (validatePhoneNumber(phone)) {
                                const carrier = getCarrierFromPhone(phone);
                                console.log(`Detected carrier: ${carrier}`);
                              }
                            }}
                          />
                          {field.value && validatePhoneNumber(field.value) && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {getCarrierFromPhone(field.value)}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => field.onChange(method.id)}
                              className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary hover:bg-primary/5'
                              }`}
                              data-testid={`payment-method-${method.id}`}
                            >
                              <Icon className={`w-6 h-6 mb-2 ${method.color}`} />
                              <span className="text-sm font-medium">
                                {method.name}
                              </span>
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

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t.payment.processing}
            </h3>
            <p className="text-muted-foreground">
              Fadlan sug, waqti yar ayay qaadan doontaa
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t.payment.success}
            </h3>
            <p className="text-muted-foreground mb-6">
              Koorsadaada waa diyaar u tahay soo dejinta
            </p>
            <Button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.payment.download}
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Payment Failed
            </h3>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-close"
              >
                Close
              </Button>
              <Button
                onClick={() => setStep('details')}
                className="flex-1"
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
