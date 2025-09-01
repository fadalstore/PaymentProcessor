import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Star, Lock, Zap, Bell, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  userId: string;
  premium: boolean;
  advancedFeatures: {
    aiOptimization: boolean;
    conflictResolution: boolean;
    smartReminders: boolean;
  };
  createdAt: string;
}

interface PremiumSchedulerProps {
  userId: string;
  isPremium: boolean;
  onUpgradeClick?: () => void;
}

export function PremiumScheduler({ userId, isPremium, onUpgradeClick }: PremiumSchedulerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateSchedule = async () => {
    if (!title || !date || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/premium/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          scheduleData: {
            title,
            description,
            date,
            time,
            duration,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Premium Feature",
            description: data.message || "Advanced scheduling requires a premium subscription",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.message || 'Failed to create schedule');
      }

      setSchedules(prev => [...prev, data.schedule]);
      
      // Clear form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setDuration(60);

      toast({
        title: "Schedule Created",
        description: data.message,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Scheduling error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-gray-400" />
            <CardTitle className="text-2xl text-gray-600">Advanced Scheduler</CardTitle>
            <Badge className="bg-amber-500 text-white">Premium</Badge>
          </div>
          <CardDescription>
            Professional scheduling with AI optimization and smart features
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Premium Scheduling Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-700">AI Optimization</h4>
                <p className="text-sm text-gray-600">Smart scheduling optimization</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-700">Conflict Resolution</h4>
                <p className="text-sm text-gray-600">Automatic conflict detection</p>
              </div>
              <div className="text-center">
                <Bell className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-700">Smart Reminders</h4>
                <p className="text-sm text-gray-600">Intelligent notification system</p>
              </div>
            </div>
            <Button 
              onClick={onUpgradeClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Create Schedule Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl">Advanced Scheduler</CardTitle>
              <Badge className="bg-amber-500 text-white">
                <Star className="w-4 h-4 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
          <CardDescription>
            Create intelligent schedules with AI optimization, conflict resolution, and smart reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Event Title *</label>
                <Input
                  placeholder="Meeting with team"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="Event details and notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date *</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Time *</label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  min={15}
                  step={15}
                />
              </div>

              <Button 
                onClick={handleCreateSchedule}
                disabled={loading || !title || !date || !time}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Schedule...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Premium Schedule
                  </>
                )}
              </Button>
            </div>

            {/* Premium Features Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800">Premium Features Active</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">AI Optimization</h4>
                    <p className="text-sm text-blue-700">Automatically optimizes your schedule for efficiency</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Conflict Resolution</h4>
                    <p className="text-sm text-green-700">Detects and resolves scheduling conflicts</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-900">Smart Reminders</h4>
                    <p className="text-sm text-purple-700">Intelligent notifications at optimal times</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Schedules */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Schedules</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{schedule.title}</h4>
                    <p className="text-sm text-gray-600">{schedule.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{new Date(schedule.date).toLocaleDateString()}</span>
                      <span>{schedule.time}</span>
                      <span>{schedule.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-amber-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}