import { useState, useEffect } from 'react';
import { voiceService } from '@/services/voiceService';
import { searchService, SearchResult, YouTubeResult } from '@/services/searchService';
import { useApiKey } from '@/hooks/useApiKey';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

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
  const { apiKeys, userId } = useApiKey();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize services when API keys change
  useEffect(() => {
    if (apiKeys.tavily) {
      searchService.setTavilyApiKey(apiKeys.tavily);
    }
    if (apiKeys.openai) {
      voiceService.setOpenAIKey(apiKeys.openai);
    }
  }, [apiKeys]);

  // Load conversations based on authentication status
  useEffect(() => {
    const loadConversations = async () => {
      setIsSyncing(true);
      try {
        if (userId) {
          // Fetch conversations from Supabase
          const { data: conversationsData, error: conversationsError } = await supabase
            .from('conversations')
            .select('id, title, created_at, updated_at')
            .order('updated_at', { ascending: false });

          if (conversationsError) throw conversationsError;

          const loadedConversations: Conversation[] = [];

          for (const conv of conversationsData) {
            // Fetch messages for each conversation
            const { data: messagesData, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            // Fetch search results
            const { data: searchResultsData, error: searchResultsError } = await supabase
              .from('search_results')
              .select('*')
              .eq('conversation_id', conv.id);

            if (searchResultsError) throw searchResultsError;

            // Fetch YouTube results
            const { data: youtubeResultsData, error: youtubeResultsError } = await supabase
              .from('youtube_results')
              .select('*')
              .eq('conversation_id', conv.id);

            if (youtubeResultsError) throw youtubeResultsError;

            // Format message timestamps
            const messages = messagesData.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at)
            }));

            // Transform YouTube results to match the YouTubeResult interface
            const youtubeResults = youtubeResultsData.map(result => ({
              title: result.title,
              videoId: result.video_id,
              thumbnail: result.thumbnail,
              channelTitle: result.channel_title || '',
              description: result.description || ''
            }));

            loadedConversations.push({
              id: conv.id,
              title: conv.title,
              messages: messages,
              searchResults: searchResultsData,
              youtubeResults: youtubeResults,
              timestamp: new Date(conv.created_at)
            });
          }

          setConversations(loadedConversations);
          
          // Migrate localStorage conversations if needed
          const savedConversations = localStorage.getItem('elderQueryConversations');
          if (savedConversations) {
            try {
              const parsed = JSON.parse(savedConversations);
              // Only migrate if we have conversations in localStorage and none in Supabase
              if (parsed.length > 0 && loadedConversations.length === 0) {
                await migrateLocalStorageConversations(parsed);
              }
              // Clear localStorage after migration attempt
              localStorage.removeItem('elderQueryConversations');
            } catch (e) {
              console.error('Error parsing localStorage conversations:', e);
            }
          }
        } else {
          // If not authenticated, load from localStorage
          const savedConversations = localStorage.getItem('elderQueryConversations');
          if (savedConversations) {
            try {
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
            } catch (e) {
              console.error('Error loading localStorage conversations:', e);
              toast({
                title: "Error",
                description: "Failed to load past conversations",
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive"
        });
      } finally {
        setIsSyncing(false);
        setIsInitialized(true);
      }
    };

    // Helper function to migrate localStorage conversations to Supabase
    const migrateLocalStorageConversations = async (localConversations: any[]) => {
      try {
        for (const conv of localConversations) {
          // Insert conversation
          const { data: convData, error: convError } = await supabase
            .from('conversations')
            .insert({
              id: conv.id,
              title: conv.title,
              user_id: userId,
              created_at: new Date(conv.timestamp).toISOString(),
              updated_at: new Date(conv.timestamp).toISOString()
            })
            .select('id')
            .single();

          if (convError) throw convError;

          // Insert messages
          if (conv.messages && conv.messages.length > 0) {
            const messagesForInsert = conv.messages.map((msg: any) => ({
              id: msg.id,
              conversation_id: conv.id,
              role: msg.role,
              content: msg.content,
              created_at: new Date(msg.timestamp).toISOString()
            }));

            const { error: msgError } = await supabase
              .from('messages')
              .insert(messagesForInsert);

            if (msgError) throw msgError;
          }

          // Insert search results
          if (conv.searchResults && conv.searchResults.length > 0) {
            const searchResultsForInsert = conv.searchResults.map((result: any) => ({
              conversation_id: conv.id,
              title: result.title,
              url: result.url,
              content: result.content,
              score: result.score
            }));

            const { error: srError } = await supabase
              .from('search_results')
              .insert(searchResultsForInsert);

            if (srError) throw srError;
          }

          // Insert YouTube results
          if (conv.youtubeResults && conv.youtubeResults.length > 0) {
            const youtubeResultsForInsert = conv.youtubeResults.map((result: any) => ({
              conversation_id: conv.id,
              title: result.title,
              video_id: result.videoId,
              thumbnail: result.thumbnail,
              channel_title: result.channelTitle,
              description: result.description
            }));

            const { error: ytError } = await supabase
              .from('youtube_results')
              .insert(youtubeResultsForInsert);

            if (ytError) throw ytError;
          }
        }
      } catch (error) {
        console.error('Error migrating localStorage conversations to Supabase:', error);
        throw error;
      }
    };

    loadConversations();
  }, [userId]);

  // Save conversations to localStorage when they change (only if not authenticated)
  useEffect(() => {
    if (!isInitialized || isSyncing) return;
    
    if (!userId) {
      try {
        localStorage.setItem('elderQueryConversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Error saving conversations to localStorage:', error);
      }
    }
  }, [conversations, isInitialized, isSyncing, userId]);

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

  const createNewConversation = async (): Promise<Conversation> => {
    const newId = uuidv4();
    const newConversation = {
      id: newId,
      title: "New Conversation",
      messages: [],
      timestamp: new Date()
    };

    if (userId) {
      try {
        // Save to Supabase
        const { error } = await supabase
          .from('conversations')
          .insert({
            id: newId,
            title: "New Conversation",
            user_id: userId,
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error creating new conversation in Supabase:', error);
        toast({
          title: "Error",
          description: "Failed to create new conversation",
          variant: "destructive"
        });
      }
    }

    // Add the new conversation to the local state
    setConversations(prev => [newConversation, ...prev]);
    
    return newConversation;
  };

  const handleSubmitQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    
    // Create a new conversation if none exists
    let conv = currentConversation;
    if (!currentConversation) {
      const newConversation = await createNewConversation();
      conv = newConversation;
      setCurrentConversation(newConversation);
    }
    
    // Add user message
    const messageId = uuidv4();
    const timestamp = new Date();
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: query,
      timestamp
    };
    
    // Update conversation title if this is the first message
    let updatedTitle = conv.title;
    if (conv.messages.length === 0) {
      updatedTitle = query.length > 30 ? query.substring(0, 30) + "..." : query;
      // Update title in Supabase if authenticated
      if (userId) {
        try {
          await supabase
            .from('conversations')
            .update({ title: updatedTitle, updated_at: timestamp.toISOString() })
            .eq('id', conv.id);
        } catch (error) {
          console.error('Error updating conversation title:', error);
        }
      }
    }
    
    const updatedConv = {
      ...conv,
      title: updatedTitle,
      messages: [...conv.messages, userMessage]
    };
    
    setCurrentConversation(updatedConv);
    
    // Save user message to Supabase if authenticated
    if (userId) {
      try {
        await supabase.from('messages').insert({
          id: messageId,
          conversation_id: conv.id,
          role: 'user',
          content: query,
          created_at: timestamp.toISOString()
        });
      } catch (error) {
        console.error('Error saving user message to Supabase:', error);
      }
    }
    
    try {
      // Process with LLM - pass the current conversation messages for context
      const aiResponse = await voiceService.processWithLLM(query, updatedConv.messages);
      
      // Perform search
      const searchResults = await searchService.performSearch(query);
      
      // Search YouTube
      const youtubeResults = await searchService.searchYouTube(query);
      
      // Add assistant message
      const assistantMessageId = uuidv4();
      const assistantTimestamp = new Date();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: aiResponse,
        timestamp: assistantTimestamp
      };
      
      // Update the conversation with new message and search results
      const finalUpdatedConv = {
        ...updatedConv,
        messages: [...updatedConv.messages, assistantMessage],
        searchResults,
        youtubeResults
      };
      
      setCurrentConversation(finalUpdatedConv);
      
      // Update in conversations list
      setConversations(prevConvs => {
        return prevConvs.map(c => c.id === finalUpdatedConv.id ? finalUpdatedConv : c);
      });
      
      // Save to Supabase if authenticated
      if (userId) {
        try {
          // Save assistant message
          await supabase.from('messages').insert({
            id: assistantMessageId,
            conversation_id: conv.id,
            role: 'assistant',
            content: aiResponse,
            created_at: assistantTimestamp.toISOString()
          });
          
          // Save search results
          if (searchResults && searchResults.length > 0) {
            const searchResultsForInsert = searchResults.map(result => ({
              conversation_id: conv.id,
              title: result.title,
              url: result.url,
              content: result.content,
              score: result.score
            }));
            
            await supabase.from('search_results').insert(searchResultsForInsert);
          }
          
          // Save YouTube results
          if (youtubeResults && youtubeResults.length > 0) {
            const youtubeResultsForInsert = youtubeResults.map(result => ({
              conversation_id: conv.id,
              title: result.title,
              video_id: result.videoId,
              thumbnail: result.thumbnail,
              channel_title: result.channelTitle,
              description: result.description
            }));
            
            await supabase.from('youtube_results').insert(youtubeResultsForInsert);
          }
          
          // Update conversation timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: assistantTimestamp.toISOString() })
            .eq('id', conv.id);
        } catch (error) {
          console.error('Error saving data to Supabase:', error);
        }
      }
      
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

  const deleteConversation = async (conversationId: string) => {
    // Delete from Supabase if authenticated
    if (userId) {
      try {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
      } catch (error) {
        console.error('Error deleting conversation from Supabase:', error);
        toast({
          title: "Error",
          description: "Failed to delete conversation",
          variant: "destructive"
        });
      }
    }
    
    // Update local state
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
    handleSubmitQuery,
    createNewConversation
  };
}
