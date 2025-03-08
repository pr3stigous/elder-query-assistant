
import { useState, useEffect } from 'react';
import { voiceService } from '@/services/voiceService';
import { searchService, SearchResult, YouTubeResult } from '@/services/searchService';
import { useApiKey } from '@/hooks/useApiKey';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  searchResults?: SearchResult[];
  youtubeResults?: YouTubeResult[];
  timestamp: Date;
}

export function useConversation() {
  const { apiKeys } = useApiKey();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services when API keys change
  useEffect(() => {
    if (apiKeys.tavily) {
      searchService.setTavilyApiKey(apiKeys.tavily);
    }
    if (apiKeys.openai) {
      voiceService.setOpenAIKey(apiKeys.openai);
    }
  }, [apiKeys]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('elderQueryConversations');
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        // Convert string timestamps back to Date objects
        const formattedConversations = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(formattedConversations);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load past conversations",
        variant: "destructive"
      });
      setIsInitialized(true);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('elderQueryConversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, [conversations, isInitialized]);

  // Set up voice service callbacks
  useEffect(() => {
    voiceService.setCallbacks({
      onTranscript: (text) => {
        setTranscript(text);
      },
      onStart: () => {
        setIsListening(true);
        setTranscript('');
      },
      onEnd: () => {
        setIsListening(false);
        if (transcript) {
          handleSubmitQuery(transcript);
        }
      },
      onError: (error) => {
        setIsListening(false);
        console.error('Voice error:', error);
      }
    });
  }, [transcript]);

  const startListening = () => {
    if (!apiKeys.openai || !apiKeys.tavily) {
      toast({
        title: "API Keys Required",
        description: "Please add your OpenAI and Tavily API keys in settings",
        variant: "destructive"
      });
      return;
    }
    
    voiceService.startListening();
  };

  const stopListening = () => {
    voiceService.stopListening();
  };

  const createNewConversation = (): Conversation => {
    return {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      timestamp: new Date()
    };
  };

  const handleSubmitQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    
    // Create a new conversation if none exists
    if (!currentConversation) {
      const newConversation = createNewConversation();
      setCurrentConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setCurrentConversation(prev => {
      if (!prev) return null;
      const updatedConv = {
        ...prev,
        title: prev.messages.length === 0 ? query.substring(0, 30) + "..." : prev.title,
        messages: [...prev.messages, userMessage]
      };
      return updatedConv;
    });
    
    try {
      // Process with LLM
      const aiResponse = await voiceService.processWithLLM(query);
      
      // Perform search
      const searchResults = await searchService.performSearch(query);
      
      // Search YouTube
      const youtubeResults = await searchService.searchYouTube(query);
      
      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        const updatedConv = {
          ...prev,
          messages: [...prev.messages, assistantMessage],
          searchResults,
          youtubeResults
        };
        
        // Update in conversations list
        setConversations(prevConvs => {
          return prevConvs.map(conv => 
            conv.id === updatedConv.id ? updatedConv : conv
          );
        });
        
        return updatedConv;
      });
      
    } catch (error) {
      console.error('Error processing query:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const switchConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  };

  return {
    transcript,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    clearTranscript,
    currentConversation,
    conversations,
    switchConversation,
    deleteConversation,
    handleSubmitQuery
  };
}
