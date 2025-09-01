import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Clock, Brain, Star, CreditCard, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
}

interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
}

interface PremiumSubscriptionProps {
  userId: string;
  userEmail?: string;
}

export function PremiumSubscription({ userId, userEmail }: PremiumSubscriptionProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
  const [mobileProvider, setMobileProvider] = useState<'evc' | 'zaad' | 'edahab'>('evc');
  const [phone, setPhone] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [userId]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${userId}`);
      const data = await response.json();
      
      setSubscription(data.subscription);
      setProfile(data.profile);
      setIsPremium(data.isPremium);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setShowPaymentDialog(true);
  };

  const handleCardPayment = async () => {
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please provide your email address to upgrade",
        variant: "destructive",
      });
      return;
    }

    setUpgrading(true);
    
    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          plan: 'premium',
          customerEmail: userEmail,
          returnUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Upgrade failed:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to start upgrade process",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleMobilePayment = async () => {
    if (!phone) {
      toast({
        title: "Phone Number Required",
        description: "Please provide your phone number",
        variant: "destructive",
      });
      return;
    }

    setUpgrading(true);
    
    try {
      const response = await fetch('/api/subscriptions/create-mobile-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          paymentMethod: mobileProvider,
          phone,
          plan: 'premium',
          customerEmail: userEmail || `${phone}@mobile.local`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create mobile money subscription');
      }

      setPaymentInstructions(data);
      setShowPaymentDialog(false);
      setShowInstructions(true);

      toast({
        title: "Payment Instructions Created",
        description: "Please follow the USSD instructions to complete payment",
      });
    } catch (error: any) {
      console.error('Mobile payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create mobile payment",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const premiumFeatures = [
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Advanced AI-powered assistance with context awareness and personalized recommendations",
    },
    {
      icon: Clock,
      title: "Advanced Scheduling",
      description: "Smart scheduling with AI optimization, conflict resolution, and automatic reminders",
    },
    {
      icon: Star,
      title: "Priority Support",
      description: "Get priority customer support and access to premium features first",
    },
    {
      icon: Zap,
      title: "Enhanced Performance",
      description: "Faster processing, higher limits, and premium infrastructure",
    },
  ];

  if (isPremium) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-2 border-amber-500">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center space-x-2">
            <Badge className="bg-amber-500 text-white">
              <Star className="w-4 h-4 mr-1" />
              Premium
            </Badge>
            <CardTitle className="text-2xl">Premium Subscription Active</CardTitle>
          </div>
          <CardDescription>
            You have access to all premium features until{' '}
            {subscription?.currentPeriodEnd && 
              new Date(subscription.currentPeriodEnd).toLocaleDateString()
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <feature.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank')}
              className="flex-1"
            >
              Manage Subscription
            </Button>
            <Button 
              onClick={fetchSubscriptionStatus}
              variant="secondary"
              className="flex-1"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Upgrade to Premium</CardTitle>
        <CardDescription className="text-lg">
          Unlock powerful AI features and advanced scheduling tools
        </CardDescription>
        <div className="mt-4">
          <div className="text-4xl font-bold text-primary">$29.99</div>
          <div className="text-sm text-gray-600">per month</div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-6">
            <Button 
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
              size="lg"
            >
              {upgrading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-600 mt-2">
              Secure payment processing by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you'd like to pay for your premium subscription ($29.99/month)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Options</Label>
              
              {/* Card Payment Option */}
              <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setPaymentMethod('card')}>
                <div className="flex items-center space-x-3">
                  <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600">Secure payment via Stripe</div>
                  </div>
                </div>
              </div>

              {/* Mobile Money Option */}
              <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setPaymentMethod('mobile')}>
                <div className="flex items-center space-x-3">
                  <input type="radio" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} />
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-gray-600">EVC Plus, ZAAD, eDahab</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Money Provider Selection */}
            {paymentMethod === 'mobile' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mobile Money Provider</Label>
                <select 
                  value={mobileProvider} 
                  onChange={(e) => setMobileProvider(e.target.value as 'evc' | 'zaad' | 'edahab')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="evc">EVC Plus (Somalia)</option>
                  <option value="zaad">ZAAD (Somaliland)</option>
                  <option value="edahab">eDahab (Somalia)</option>
                </select>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="252634567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">
                    Enter your {mobileProvider.toUpperCase()} number with country code
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={paymentMethod === 'card' ? handleCardPayment : handleMobilePayment}
                disabled={upgrading || (paymentMethod === 'mobile' && !phone)}
                className="flex-1"
              >
                {upgrading ? 'Processing...' : `Pay $29.99`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Payment Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Instructions</DialogTitle>
            <DialogDescription>
              Follow these steps to complete your premium subscription
            </DialogDescription>
          </DialogHeader>
          
          {paymentInstructions && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">{paymentInstructions.provider}</span>
                </div>
                <div className="text-sm text-green-700 mb-3">
                  Amount: ${paymentInstructions.amount} USD
                </div>
                <div className="bg-white border border-green-300 rounded p-3">
                  <div className="text-sm text-gray-600 mb-1">Dial this USSD code:</div>
                  <div className="font-mono text-lg font-bold text-green-800">
                    {paymentInstructions.ussdCode}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Instructions:</div>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Dial the USSD code shown above</li>
                  <li>Follow the prompts on your phone</li>
                  <li>Confirm the payment amount ($29.99)</li>
                  <li>Enter your PIN to complete the transaction</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <Button onClick={() => setShowInstructions(false)} className="w-full">
                  I've completed the payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
  );
}