
import React from 'react';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isProcessing,
  onClick,
  className
}) => {
  return (
    <button
      className={cn(
        'elderly-button w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center',
        isListening 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : isProcessing
            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
            : 'bg-elder-blue hover:bg-elder-blue-dark text-white',
        className
      )}
      onClick={onClick}
      disabled={isProcessing}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {isListening ? (
        <Square className="w-12 h-12 md:w-16 md:h-16" />
      ) : (
        <Mic className="w-12 h-12 md:w-16 md:h-16" />
      )}
    </button>
  );
};

export default VoiceButton;
