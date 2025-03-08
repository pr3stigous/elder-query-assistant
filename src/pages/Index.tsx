
import { useConversation } from '@/hooks/useConversation';
import VoiceButton from '@/components/VoiceButton';
import ConversationDisplay from '@/components/ConversationDisplay';
import ConversationHistory from '@/components/ConversationHistory';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

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

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Could not log you in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Sign out error:", error);
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
          <div className="flex justify-between items-center">
            {!user && !loading ? (
              <Button 
                onClick={handleLogin}
                className="bg-elder-blue hover:bg-elder-blue-dark text-white"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to save conversations
              </Button>
            ) : user ? (
              <div className="flex items-center">
                <span className="text-sm mr-2">Signed in as {user.email}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div></div>
            )}
            <Button
              onClick={handleNewConversation}
              className="bg-elder-blue hover:bg-elder-blue-dark text-white"
              disabled={isProcessing || isListening}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Conversation
            </Button>
          </div>
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
