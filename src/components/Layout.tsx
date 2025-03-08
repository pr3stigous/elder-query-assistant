
import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApiKey, ApiKeyType } from '@/hooks/useApiKey';
import { toast } from '@/hooks/use-toast';

interface LayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  voiceButton: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ sidebar, content, voiceButton }) => {
  const { apiKeys, saveApiKey, clearApiKey, hasAllRequiredKeys } = useApiKey();
  const [apiInputs, setApiInputs] = useState({
    tavily: '',
    openai: '',
  });
  const [showKeyWarning, setShowKeyWarning] = useState(!hasAllRequiredKeys());
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-elder-gray">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-elderly-xl font-bold text-elder-blue">Elder Query Assistant</h1>
        
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
