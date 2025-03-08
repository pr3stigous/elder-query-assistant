
import { useConversation } from '@/hooks/useConversation';
import VoiceButton from '@/components/VoiceButton';
import ConversationDisplay from '@/components/ConversationDisplay';
import ConversationHistory from '@/components/ConversationHistory';
import Layout from '@/components/Layout';

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
    handleSubmitQuery
  } = useConversation();

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNewConversation = () => {
    // Start a new conversation by clearing the current one
    // The useConversation hook will create a new one when the user speaks
    if (currentConversation) {
      switchConversation('');
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
        <ConversationDisplay
          messages={currentConversation?.messages || []}
          searchResults={currentConversation?.searchResults}
          youtubeResults={currentConversation?.youtubeResults}
          transcript={transcript}
          isListening={isListening}
          isProcessing={isProcessing}
        />
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
