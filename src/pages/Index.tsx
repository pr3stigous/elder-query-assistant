
import { useConversation } from '@/hooks/useConversation';
import VoiceButton from '@/components/VoiceButton';
import ConversationDisplay from '@/components/ConversationDisplay';
import ConversationHistory from '@/components/ConversationHistory';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Index = () => {
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
          <div className="flex justify-end">
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
