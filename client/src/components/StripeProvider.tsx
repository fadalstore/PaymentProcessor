import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

// Initialize Stripe (will work once VITE_STRIPE_PUBLIC_KEY is provided)
let stripePromise: Promise<any> | null = null;

if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  console.log("✅ Stripe public key found - Card payments enabled");
} else {
  console.log("⚠️ Stripe public key not found - Card payments disabled");
}

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  if (!stripePromise) {
    // Return children without Stripe wrapper if no public key
    return <>{children}</>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

export const isStripeEnabled = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;