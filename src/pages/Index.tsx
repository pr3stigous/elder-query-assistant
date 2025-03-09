
import { useConversation } from '@/hooks/useConversation';
import VoiceButton from '@/components/VoiceButton';
import ConversationDisplay from '@/components/ConversationDisplay';
import ConversationHistory from '@/components/ConversationHistory';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ConversationControls from '@/components/ConversationControls';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    transcript,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    currentConversation,
    conversations,
    switchConversation,
    deleteConversation,
    handleSubmitQuery,
    createNewConversation
  } = useConversation();

  useEffect(() => {
    // Check current auth status
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNewConversation = async () => {
    try {
      // Create a new conversation
      const newConversation = await createNewConversation();
      // Switch to the new conversation
      switchConversation(newConversation.id);
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout
      sidebar={
        <ConversationHistory
          conversations={conversations}
          currentConversationId={currentConversation?.id || null}
          onSelectConversation={switchConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={handleNewConversation}
        />
      }
      content={
        <div className="flex flex-col h-full gap-4">
          <ConversationControls
            user={user}
            loading={loading}
            isProcessing={isProcessing}
            isListening={isListening}
            onUserChange={setUser}
            onNewConversation={handleNewConversation}
          />
          <div className="flex-1">
            <ConversationDisplay
              messages={currentConversation?.messages || []}
              searchResults={currentConversation?.searchResults}
              youtubeResults={currentConversation?.youtubeResults}
              transcript={transcript}
              isListening={isListening}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      }
      voiceButton={
        <VoiceButton
          isListening={isListening}
          isProcessing={isProcessing}
          onClick={handleVoiceButtonClick}
        />
      }
    />
  );
};

export default Index;
