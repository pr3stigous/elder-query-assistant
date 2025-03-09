
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthDialog from './AuthDialog';
import UserPanel from './UserPanel';

interface ConversationControlsProps {
  user: any;
  loading: boolean;
  isProcessing: boolean;
  isListening: boolean;
  onUserChange: (user: any) => void;
  onNewConversation: () => void;
}

const ConversationControls: React.FC<ConversationControlsProps> = ({
  user,
  loading,
  isProcessing,
  isListening,
  onUserChange,
  onNewConversation
}) => {
  return (
    <div className="flex justify-between items-center">
      {!user && !loading ? (
        <AuthDialog onUserChange={onUserChange} />
      ) : user ? (
        <UserPanel user={user} onSignOut={() => onUserChange(null)} />
      ) : (
        <div></div>
      )}
      <Button
        onClick={onNewConversation}
        className="bg-elder-blue hover:bg-elder-blue-dark text-white"
        disabled={isProcessing || isListening}
      >
        <Plus className="mr-2 h-5 w-5" />
        New Conversation
      </Button>
    </div>
  );
};

export default ConversationControls;
