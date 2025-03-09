
import React, { useState } from 'react';
import { User, Bot, Search, Loader2, Youtube, VolumeX, Volume2 } from 'lucide-react';
import { Message } from '@/hooks/useConversation';
import { SearchResult, YouTubeResult } from '@/services/searchService';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SearchResults from '@/components/SearchResults';
import YoutubeResult from '@/components/YoutubeResult';
import { Button } from '@/components/ui/button';
import { ttsService } from '@/services/ttsService';

interface ConversationDisplayProps {
  messages: Message[];
  searchResults?: SearchResult[];
  youtubeResults?: YouTubeResult[];
  transcript: string;
  isListening: boolean;
  isProcessing: boolean;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  searchResults,
  youtubeResults,
  transcript,
  isListening,
  isProcessing
}) => {
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);

  const handleReadAloud = (text: string, messageId: string) => {
    if (readingMessageId === messageId) {
      // Stop reading if the same message is clicked again
      ttsService.stop();
      setReadingMessageId(null);
    } else {
      // Read the new message
      ttsService.stop(); // Stop any current reading
      ttsService.speak(text);
      setReadingMessageId(messageId);
      
      // Reset the reading state when speech ends
      const checkIfStillReading = setInterval(() => {
        if (!ttsService.isCurrentlyReading()) {
          setReadingMessageId(null);
          clearInterval(checkIfStillReading);
        }
      }, 500);
    }
  };

  const handleReadSearchResult = (result: SearchResult) => {
    const textToRead = `${result.title}. ${result.content}`;
    ttsService.speak(textToRead);
  };

  const handleReadYoutubeResult = (result: YouTubeResult) => {
    const textToRead = `${result.title} by ${result.channelTitle}. ${result.description}`;
    ttsService.speak(textToRead);
  };

  return (
    <div className="elderly-card flex flex-col h-full overflow-hidden bg-white">
      <div className="p-elderly-lg bg-elder-gray rounded-t-elderly border-b">
        <h2 className="text-elderly-xl text-elder-text font-bold">Conversation</h2>
      </div>
      
      <ScrollArea className="flex-1 p-elderly">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              {message.role === 'assistant' && (
                <div className="w-12 h-12 rounded-full bg-elder-blue flex items-center justify-center text-white flex-shrink-0">
                  <Bot size={24} />
                </div>
              )}
              
              <div className={`p-4 rounded-elderly max-w-[80%] ${
                message.role === 'assistant' 
                  ? 'bg-elder-gray text-elder-text' 
                  : 'bg-elder-blue text-white'
              }`}>
                <p className="text-elderly whitespace-pre-wrap">{message.content}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() => handleReadAloud(message.content, message.id)}
                      aria-label={readingMessageId === message.id ? "Stop reading" : "Read aloud"}
                    >
                      {readingMessageId === message.id ? (
                        <VolumeX size={18} className="text-elder-blue-dark" />
                      ) : (
                        <Volume2 size={18} className="text-elder-blue" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-12 h-12 rounded-full bg-elder-blue-dark flex items-center justify-center text-white flex-shrink-0">
                  <User size={24} />
                </div>
              )}
            </div>
          ))}
          
          {/* Search Results */}
          {messages.length > 0 && searchResults && searchResults.length > 0 && (
            <div className="my-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-elder-blue" />
                <h3 className="text-elderly-lg font-semibold">Search Results</h3>
              </div>
              <SearchResults 
                results={searchResults} 
                onReadAloud={handleReadSearchResult}
              />
            </div>
          )}
          
          {/* YouTube Results */}
          {messages.length > 0 && youtubeResults && youtubeResults.length > 0 && (
            <div className="my-6">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="text-red-600" />
                <h3 className="text-elderly-lg font-semibold">YouTube Videos</h3>
              </div>
              <div className="space-y-4">
                {youtubeResults.map((result) => (
                  <YoutubeResult 
                    key={result.videoId} 
                    video={result} 
                    onReadAloud={() => handleReadYoutubeResult(result)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Show current transcript while listening */}
          {isListening && transcript && (
            <div className="flex gap-4 justify-end">
              <div className="p-4 rounded-elderly max-w-[80%] bg-elder-blue-light text-white">
                <p className="text-elderly">{transcript}</p>
                <div className="flex items-center text-xs mt-2">
                  <span className="animate-pulse mr-2">●</span> Listening...
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-elder-blue-dark flex items-center justify-center text-white">
                <User size={24} />
              </div>
            </div>
          )}
          
          {/* Show loading indicator while processing */}
          {isProcessing && (
            <div className="flex justify-center my-4">
              <div className="p-4 bg-gray-100 rounded-elderly flex items-center gap-2">
                <Loader2 className="animate-spin text-elder-blue" />
                <span className="text-elderly">Processing your query...</span>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {messages.length === 0 && !isListening && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-elder-gray flex items-center justify-center mb-4">
                <Bot size={32} className="text-elder-blue-dark" />
              </div>
              <h3 className="text-elderly-lg font-semibold text-gray-700 mb-2">Ready to Help</h3>
              <p className="text-elderly text-gray-600 max-w-md">
                Press the microphone button and ask me a question. I'm here to help with whatever you need!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationDisplay;
