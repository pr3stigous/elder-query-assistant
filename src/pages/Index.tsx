
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have been signed in successfully",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      
      // If user doesn't exist, offer to sign up
      if (error.message.includes("Invalid login credentials")) {
        const shouldSignUp = window.confirm("Account not found. Would you like to create a new account?");
        if (shouldSignUp) {
          handleSignUp();
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid login credentials. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Could not log you in. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAuthLoading(false);
    }
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

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Account Created",
        description: "Please check your email for a confirmation link",
      });
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthLoading(false);
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
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setIsOpen(true)}
                    className="bg-elder-blue hover:bg-elder-blue-dark text-white"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign in to save conversations
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSignUp}
                        variant="outline"
                        disabled={isAuthLoading}
                        className="flex-1"
                      >
                        Sign Up
                      </Button>
                      <Button
                        onClick={handleLogin}
                        disabled={isAuthLoading}
                        className="flex-1"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
