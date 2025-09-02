import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useEffect, useState } from "react";

interface StripeProviderProps {
  children: ReactNode;
}

let stripePromise: Promise<any> | null = null;

export function StripeProvider({ children }: StripeProviderProps) {
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (config.stripe.publishableKey) {
          stripePromise = loadStripe(config.stripe.publishableKey);
          console.log("✅ Stripe public key found - Card payments enabled");
        } else {
          console.log("⚠️ Stripe public key not found - Card payments disabled");
        }
      } catch (error) {
        console.error("Failed to load Stripe configuration:", error);
      } finally {
        setIsStripeLoaded(true);
      }
    };

    if (!stripePromise) {
      initializeStripe();
    } else {
      setIsStripeLoaded(true);
    }
  }, []);

  if (!isStripeLoaded) {
    return <>{children}</>;
  }

  if (!stripePromise) {
    // Return children without Stripe wrapper if no public key
    return <>{children}</>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

export const checkStripeEnabled = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    return config.stripe.enabled && !!config.stripe.publishableKey;
  } catch {
    return false;
  }
};

// For backward compatibility - check if Stripe is properly configured
export let isStripeEnabled = false;

// Update the flag when Stripe is loaded
if (typeof window !== 'undefined') {
  checkStripeEnabled().then(enabled => {
    isStripeEnabled = enabled;
    console.log('🔄 Stripe enabled status:', enabled);
  });
}