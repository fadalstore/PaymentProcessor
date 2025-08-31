import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Course } from "@shared/schema";
import { type Language, getTranslation } from "@/lib/i18n";

const cardFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
});

type CardFormData = z.infer<typeof cardFormSchema>;

interface CardPaymentFormProps {
  course: Course;
  language: Language;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function CardPaymentForm({ course, language, onSuccess, onError }: CardPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const t = getTranslation(language);

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = async (data: CardFormData) => {
    if (!stripe || !elements) {
      onError("Payment system not ready. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Card information not found. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          courseId: course.id,
          amount: parseFloat(course.price),
          currency: "usd",
          customerName: data.name,
          customerEmail: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment");
      }

      const { clientSecret, paymentId } = await response.json();

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: data.name,
              email: data.email || undefined,
            },
          },
        }
      );

      if (error) {
        console.error("Payment failed:", error);
        onError(error.message || "Payment failed. Please try again.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: t.payment.success,
          description: t.payment.successMessage,
        });
        onSuccess(paymentId);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t.payment.cardPayment || "Card Payment"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.payment.cardName || "Cardholder Name"}</Label>
            <Input
              id="name"
              placeholder={t.payment.cardNamePlaceholder || "Enter your full name"}
              {...form.register("name")}
              data-testid="input-card-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.payment.email || "Email (Optional)"}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t.payment.emailPlaceholder || "your@email.com"}
              {...form.register("email")}
              data-testid="input-card-email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.payment.cardDetails || "Card Information"}</Label>
            <div className="border rounded-md p-3 bg-white dark:bg-gray-800" data-testid="card-element">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-lg font-bold">
              {t.payment.total || "Total"}: ${course.price}
            </div>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-card-pay"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.payment.processing || "Processing..."}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t.payment.payNow || "Pay Now"}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 text-center">
          <p>{t.payment.securePayment || "🔒 Secure payment powered by Stripe"}</p>
          <p>{t.payment.cardTypes || "Visa, Mastercard, American Express accepted"}</p>
        </div>
      </CardContent>
    </Card>
  );
}