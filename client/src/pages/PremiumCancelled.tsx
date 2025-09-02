import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Crown, HelpCircle } from 'lucide-react';
import { Link } from 'wouter';

export function PremiumCancelled() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-red-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-800">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-lg text-red-700">
            Your premium subscription payment was cancelled
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-3">What happened?</h3>
            <div className="text-red-700 space-y-2">
              <p>• Your payment was cancelled before completion</p>
              <p>• No charges were made to your account</p>
              <p>• Your account remains on the free plan</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-amber-500" />
              Still interested in Premium?
            </h3>
            <div className="text-blue-700 space-y-2">
              <p>✨ Advanced AI Assistant with context awareness</p>
              <p>📅 Smart scheduling with conflict resolution</p>
              <p>⚡ Priority support and enhanced performance</p>
              <p>🚀 Early access to new features</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/premium">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Crown className="w-5 h-5 mr-2" />
                Try Premium Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Need Help?</span>
            </div>
            <p className="text-sm text-gray-600">
              Contact our support team at{' '}
              <a href="mailto:support@coursehub.com" className="text-blue-600 hover:underline">
                support@coursehub.com
              </a>{' '}
              or try our{' '}
              <Link href="/premium">
                <span className="text-blue-600 hover:underline cursor-pointer">
                  mobile money payment options
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}