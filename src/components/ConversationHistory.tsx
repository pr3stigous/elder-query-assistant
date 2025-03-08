
import React from 'react';
import { History, Plus } from 'lucide-react';
import { Conversation } from '@/hooks/useConversation';
import { ScrollArea } from '@/components/ui/scroll-area';
import HistoryItem from '@/components/HistoryItem';
import { Button } from '@/components/ui/button';

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation
}) => {
  return (
    <div className="elderly-card flex flex-col h-full overflow-hidden bg-white">
      <div className="p-elderly-lg bg-elder-gray rounded-t-elderly border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="text-elder-blue" />
            <h2 className="text-elderly-lg text-elder-text font-bold">History</h2>
          </div>
          <Button 
            onClick={onNewConversation}
            className="bg-elder-blue hover:bg-elder-blue-dark text-white rounded-full w-10 h-10 p-0"
          >
            <Plus size={20} />
            <span className="sr-only">New Conversation</span>
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-elderly">No conversations yet</p>
              <p className="text-sm mt-2">Start a new one by pressing the microphone button</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <HistoryItem 
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversationId === conversation.id}
                onSelect={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
