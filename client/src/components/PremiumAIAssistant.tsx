import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Loader2, Star, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIResponse {
  response: string;
  usage: {
    tokens: number;
  };
  premium: boolean;
}

interface PremiumAIAssistantProps {
  userId: string;
  isPremium: boolean;
  onUpgradeClick?: () => void;
}

export function PremiumAIAssistant({ userId, isPremium, onUpgradeClick }: PremiumAIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<Array<{ type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!prompt.trim()) return;

    const userMessage = {
      type: 'user' as const,
      content: prompt,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setLoading(true);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const response = await fetch('/api/premium/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          prompt: currentPrompt,
          context: conversation.slice(-5), // Send last 5 messages for context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Premium Feature",
            description: data.message || "This feature requires a premium subscription",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.message || 'AI Assistant failed');
      }

      const aiMessage = {
        type: 'ai' as const,
        content: data.response,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      
      // Re-add the user's message to the input if there was an error
      setPrompt(currentPrompt);
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
            <CardTitle className="text-2xl text-gray-600">AI Assistant</CardTitle>
            <Badge className="bg-amber-500 text-white">Premium</Badge>
          </div>
          <CardDescription>
            Unlock the power of AI with advanced context understanding and personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Premium AI Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Advanced context understanding</li>
              <li>• Personalized recommendations</li>
              <li>• Unlimited conversations</li>
              <li>• Priority processing</li>
            </ul>
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl">AI Assistant</CardTitle>
            <Badge className="bg-amber-500 text-white">
              <Star className="w-4 h-4 mr-1" />
              Premium
            </Badge>
          </div>
        </div>
        <CardDescription>
          Your premium AI assistant with advanced context understanding and personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Conversation Display */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto space-y-4">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>Start a conversation with your AI assistant!</p>
                <p className="text-sm">Ask questions, get recommendations, or seek advice.</p>
              </div>
            ) : (
              conversation.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white ml-4' 
                        : 'bg-white border shadow-sm mr-4'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && (
                        <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg p-3 mr-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Textarea
              placeholder="Ask your AI assistant anything..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[80px] resize-none"
              disabled={loading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={loading || !prompt.trim()}
              size="lg"
              className="h-[80px] px-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Your AI assistant uses advanced language models to provide intelligent responses.
            Press Shift+Enter for new lines, Enter to send.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}