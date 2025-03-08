
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Load API keys from localStorage on mount
    const savedTavilyKey = localStorage.getItem('tavily_api_key');
    const savedOpenAIKey = localStorage.getItem('openai_api_key');
    
    setApiKeys({
      tavily: savedTavilyKey,
      openai: savedOpenAIKey,
    });
  }, []);

  const saveApiKey = (type: ApiKeyType, key: string) => {
    localStorage.setItem(`${type}_api_key`, key);
    setApiKeys(prev => ({
      ...prev,
      [type]: key,
    }));
  };

  const clearApiKey = (type: ApiKeyType) => {
    localStorage.removeItem(`${type}_api_key`);
    setApiKeys(prev => ({
      ...prev,
      [type]: null,
    }));
  };

  const hasAllRequiredKeys = (): boolean => {
    return !!apiKeys.tavily && !!apiKeys.openai;
  };

  return {
    apiKeys,
    saveApiKey,
    clearApiKey,
    hasAllRequiredKeys,
  };
}
