
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ApiKeyType = 'tavily' | 'openai';

interface ApiKeys {
  tavily: string | null;
  openai: string | null;
}

export function useApiKey() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    tavily: null,
    openai: null,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for current session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      }
      setIsLoading(false);
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load API keys from Supabase when user is authenticated or from localStorage if not
  useEffect(() => {
    const loadApiKeys = async () => {
      setIsLoading(true);
      
      if (userId) {
        // Try to load from Supabase
        try {
          const { data, error } = await supabase
            .from('api_keys')
            .select('tavily_key, openai_key')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (data) {
            setApiKeys({
              tavily: data.tavily_key,
              openai: data.openai_key
            });
          } else {
            // Check if we have keys in localStorage and migrate them
            const savedTavilyKey = localStorage.getItem('tavily_api_key');
            const savedOpenAIKey = localStorage.getItem('openai_api_key');
            
            if (savedTavilyKey || savedOpenAIKey) {
              // Migrate localStorage keys to Supabase
              await supabase.from('api_keys').insert({
                user_id: userId,
                tavily_key: savedTavilyKey,
                openai_key: savedOpenAIKey
              });
              
              setApiKeys({
                tavily: savedTavilyKey,
                openai: savedOpenAIKey
              });
              
              // Clear localStorage keys
              localStorage.removeItem('tavily_api_key');
              localStorage.removeItem('openai_api_key');
            }
          }
        } catch (error) {
          console.error('Error loading API keys from Supabase:', error);
          toast({
            title: "Error",
            description: "Failed to load API keys",
            variant: "destructive"
          });
          
          // Fallback to localStorage
          const savedTavilyKey = localStorage.getItem('tavily_api_key');
          const savedOpenAIKey = localStorage.getItem('openai_api_key');
          
          setApiKeys({
            tavily: savedTavilyKey,
            openai: savedOpenAIKey
          });
        }
      } else {
        // Load from localStorage if not authenticated
        const savedTavilyKey = localStorage.getItem('tavily_api_key');
        const savedOpenAIKey = localStorage.getItem('openai_api_key');
        
        setApiKeys({
          tavily: savedTavilyKey,
          openai: savedOpenAIKey
        });
      }
      
      setIsLoading(false);
    };

    loadApiKeys();
  }, [userId]);

  const saveApiKey = async (type: ApiKeyType, key: string) => {
    if (userId) {
      try {
        // Check if record exists
        const { data } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          // Update existing record
          await supabase
            .from('api_keys')
            .update({ [`${type}_key`]: key, updated_at: new Date() })
            .eq('user_id', userId);
        } else {
          // Insert new record
          await supabase
            .from('api_keys')
            .insert({ 
              user_id: userId, 
              [`${type}_key`]: key 
            });
        }
        
        // Update local state
        setApiKeys(prev => ({
          ...prev,
          [type]: key
        }));
      } catch (error) {
        console.error('Error saving API key to Supabase:', error);
        toast({
          title: "Error",
          description: "Failed to save API key",
          variant: "destructive"
        });
        
        // Fallback to localStorage
        localStorage.setItem(`${type}_api_key`, key);
        setApiKeys(prev => ({
          ...prev,
          [type]: key
        }));
      }
    } else {
      // Save to localStorage if not authenticated
      localStorage.setItem(`${type}_api_key`, key);
      setApiKeys(prev => ({
        ...prev,
        [type]: key
      }));
    }
  };

  const clearApiKey = async (type: ApiKeyType) => {
    if (userId) {
      try {
        await supabase
          .from('api_keys')
          .update({ [`${type}_key`]: null, updated_at: new Date() })
          .eq('user_id', userId);
          
        // Update local state  
        setApiKeys(prev => ({
          ...prev,
          [type]: null
        }));
      } catch (error) {
        console.error('Error clearing API key from Supabase:', error);
        toast({
          title: "Error",
          description: "Failed to clear API key",
          variant: "destructive"
        });
        
        // Fallback to localStorage
        localStorage.removeItem(`${type}_api_key`);
        setApiKeys(prev => ({
          ...prev,
          [type]: null
        }));
      }
    } else {
      // Remove from localStorage if not authenticated
      localStorage.removeItem(`${type}_api_key`);
      setApiKeys(prev => ({
        ...prev,
        [type]: null
      }));
    }
  };

  const hasAllRequiredKeys = (): boolean => {
    return !!apiKeys.tavily && !!apiKeys.openai;
  };

  return {
    apiKeys,
    saveApiKey,
    clearApiKey,
    hasAllRequiredKeys,
    isLoading,
    userId
  };
}
