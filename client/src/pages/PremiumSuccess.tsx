import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function PremiumSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);
    setLoading(false);

    // Clear any stored temporary data
    localStorage.removeItem('pending_subscription');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-green-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800 flex items-center justify-center space-x-2">
            <Crown className="w-8 h-8 text-amber-500" />
            <span>Premium Activated!</span>
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Your premium subscription has been successfully activated
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-3">🎉 Welcome to Premium!</h3>
            <div className="text-green-700 space-y-2">
              <p>✨ Full access to AI Assistant with advanced context understanding</p>
              <p>📅 Advanced scheduling with AI optimization and smart reminders</p>
              <p>⚡ Priority support and early access to new features</p>
              <p>🚀 Enhanced performance and higher usage limits</p>
            </div>
          </div>

          {sessionId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Transaction ID:</strong> {sessionId.substring(0, 20)}...
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Keep this for your records. You'll receive an email confirmation shortly.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/premium">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                <Crown className="w-5 h-5 mr-2" />
                Go to Premium Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@coursehub.com" className="text-blue-600 hover:underline">
                support@coursehub.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}