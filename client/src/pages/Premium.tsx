import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumSubscription } from '@/components/PremiumSubscription';
import { PremiumAIAssistant } from '@/components/PremiumAIAssistant';
import { PremiumScheduler } from '@/components/PremiumScheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Crown, Zap, Brain, Calendar, Settings } from 'lucide-react';

interface UserData {
  userId: string;
  email?: string;
  phone?: string;
}

export function Premium() {
  const [userData, setUserData] = useState<UserData>({ userId: '', email: '', phone: '' });
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd get this from your auth system
    // For now, using demo data based on user input or localStorage
    const demoUserId = localStorage.getItem('demoUserId') || `user_${Date.now()}`;
    const demoEmail = localStorage.getItem('demoEmail') || '';
    const demoPhone = localStorage.getItem('demoPhone') || '';
    
    setUserData({
      userId: demoUserId,
      email: demoEmail,
      phone: demoPhone,
    });

    // Save to localStorage for persistence
    localStorage.setItem('demoUserId', demoUserId);
    
    checkPremiumStatus(demoUserId);
  }, []);

  const checkPremiumStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium);
      }
    } catch (error) {
      console.error('Failed to check premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    // Scroll to subscription section
    document.getElementById('subscription-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const handleEmailUpdate = (email: string) => {
    setUserData(prev => ({ ...prev, email }));
    localStorage.setItem('demoEmail', email);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading premium features...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-8 h-8 text-amber-500" />
            <h1 className="text-4xl font-bold text-gray-800">Premium Dashboard</h1>
            {isPremium && (
              <Badge className="bg-amber-500 text-white">
                <Star className="w-4 h-4 mr-1" />
                Premium Active
              </Badge>
            )}
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isPremium 
              ? "Welcome to your premium experience! Enjoy full access to AI assistant and advanced scheduling tools."
              : "Unlock the full potential of our platform with premium features designed for professionals."
            }
          </p>
        </div>

        {/* User Info Card (for demo) */}
        {!userData.email && (
          <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Demo Setup</span>
              </CardTitle>
              <CardDescription>
                For this demo, please enter your email to test the premium subscription flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email for demo"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onBlur={(e) => handleEmailUpdate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEmailUpdate((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Scheduler</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Subscription</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Cards */}
              <Card className={`${isPremium ? 'border-amber-500 border-2' : 'border-gray-200'}`}>
                <CardHeader className="text-center">
                  <Brain className={`w-12 h-12 mx-auto mb-2 ${isPremium ? 'text-amber-500' : 'text-gray-400'}`} />
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <span>AI Assistant</span>
                    {isPremium && <Badge className="bg-green-500 text-white">Active</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Advanced AI with context understanding and personalized recommendations
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={`${isPremium ? 'border-amber-500 border-2' : 'border-gray-200'}`}>
                <CardHeader className="text-center">
                  <Calendar className={`w-12 h-12 mx-auto mb-2 ${isPremium ? 'text-amber-500' : 'text-gray-400'}`} />
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <span>Advanced Scheduler</span>
                    {isPremium && <Badge className="bg-green-500 text-white">Active</Badge>}
                  </CardTitle>
                  <CardDescription>
                    AI-powered scheduling with conflict resolution and smart reminders
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={`${isPremium ? 'border-amber-500 border-2' : 'border-gray-200'}`}>
                <CardHeader className="text-center">
                  <Zap className={`w-12 h-12 mx-auto mb-2 ${isPremium ? 'text-amber-500' : 'text-gray-400'}`} />
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <span>Priority Support</span>
                    {isPremium && <Badge className="bg-green-500 text-white">Active</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Get priority customer support and early access to new features
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {!isPremium && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    Unlock Premium Features
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Get full access to AI assistant, advanced scheduling, and priority support for just $29.99/month
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    <Star className="w-5 h-5 inline mr-2" />
                    Upgrade Now
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai-assistant">
            <PremiumAIAssistant 
              userId={userData.userId}
              isPremium={isPremium}
              onUpgradeClick={handleUpgradeClick}
            />
          </TabsContent>

          <TabsContent value="scheduler">
            <PremiumScheduler 
              userId={userData.userId}
              isPremium={isPremium}
              onUpgradeClick={handleUpgradeClick}
            />
          </TabsContent>

          <TabsContent value="subscription" id="subscription-section">
            <PremiumSubscription 
              userId={userData.userId}
              userEmail={userData.email}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}