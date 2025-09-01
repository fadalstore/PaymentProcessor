import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Clock, Brain, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  );
}