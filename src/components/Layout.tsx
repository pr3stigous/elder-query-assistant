
import React, { useState } from 'react';
import { Settings, X, LogIn, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApiKey, ApiKeyType } from '@/hooks/useApiKey';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  voiceButton: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ sidebar, content, voiceButton }) => {
  const { apiKeys, saveApiKey, clearApiKey, hasAllRequiredKeys, userId } = useApiKey();
  const [apiInputs, setApiInputs] = useState({
    tavily: '',
    openai: '',
  });
  const [showKeyWarning, setShowKeyWarning] = useState(!hasAllRequiredKeys());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (type: ApiKeyType, value: string) => {
    setApiInputs(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSaveKey = (type: ApiKeyType) => {
    if (!apiInputs[type].trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }

    saveApiKey(type, apiInputs[type]);
    setApiInputs(prev => ({
      ...prev,
      [type]: ''
    }));
    
    toast({
      title: "Success",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} API key saved successfully`,
    });
  };

  const handleClearKey = (type: ApiKeyType) => {
    clearApiKey(type);
    toast({
      title: "Success",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} API key removed`,
    });
  };

  const dismissKeyWarning = () => {
    setShowKeyWarning(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
      
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
      
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-elder-gray">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-elderly-xl font-bold text-elder-blue">Elder Query Assistant</h1>
        
        <div className="flex gap-2">
          {userId ? (
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-elderly">Sign In or Create Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleSignUp}
                      disabled={isLoading}
                    >
                      Sign Up
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSignIn}
                      disabled={isLoading}
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Settings className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-elderly">Settings</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="keys">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="keys">API Keys</TabsTrigger>
                </TabsList>
                <TabsContent value="keys" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tavily-key" className="text-elderly">Tavily API Key</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="tavily-key"
                          type="password"
                          value={apiInputs.tavily}
                          onChange={(e) => handleInputChange('tavily', e.target.value)}
                          placeholder={apiKeys.tavily ? "••••••••••••••••" : "Enter Tavily API key"}
                          className="elderly-input"
                        />
                        {apiKeys.tavily ? (
                          <Button 
                            variant="destructive" 
                            onClick={() => handleClearKey('tavily')}
                          >
                            Clear
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            onClick={() => handleSaveKey('tavily')}
                          >
                            Save
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Get your Tavily API key from <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-elder-blue underline">tavily.com</a>
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="openai-key" className="text-elderly">OpenAI API Key</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="openai-key"
                          type="password"
                          value={apiInputs.openai}
                          onChange={(e) => handleInputChange('openai', e.target.value)}
                          placeholder={apiKeys.openai ? "••••••••••••••••" : "Enter OpenAI API key"}
                          className="elderly-input"
                        />
                        {apiKeys.openai ? (
                          <Button 
                            variant="destructive" 
                            onClick={() => handleClearKey('openai')}
                          >
                            Clear
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            onClick={() => handleSaveKey('openai')}
                          >
                            Save
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-elder-blue underline">platform.openai.com</a>
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* API Key Warning */}
      {showKeyWarning && !hasAllRequiredKeys() && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-elderly font-medium">API Keys Required</h3>
              <p className="mt-1">Please add your OpenAI and Tavily API keys in settings to use the application.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={dismissKeyWarning}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden mb-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "Close History" : "Show History"}
          </Button>
        </div>
        
        {/* Sidebar */}
        <div className={`md:w-1/3 lg:w-1/4 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
          {sidebar}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1">
            {content}
          </div>
          
          <div className="flex justify-center py-4">
            {voiceButton}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
