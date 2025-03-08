
import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '@/hooks/useConversation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HistoryItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      className={cn(
        "p-elderly rounded-elderly cursor-pointer flex justify-between items-center gap-3 transition-colors",
        isActive 
          ? "bg-elder-blue text-white" 
          : "bg-white text-elder-text hover:bg-elder-gray"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isActive ? "bg-white text-elder-blue" : "bg-elder-gray text-elder-blue"
        )}>
          <MessageSquare size={20} />
        </div>
        <div className="overflow-hidden">
          <h3 className="font-medium text-elderly truncate">{conversation.title}</h3>
          <p className={cn(
            "text-sm truncate",
            isActive ? "text-white/80" : "text-gray-500"
          )}>
            {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        className={cn(
          "rounded-full",
          isActive ? "text-white hover:bg-white/20" : "text-gray-500 hover:bg-gray-200"
        )}
      >
        <Trash2 size={18} />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
};

export default HistoryItem;
