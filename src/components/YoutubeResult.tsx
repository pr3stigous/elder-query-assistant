
import React from 'react';
import { ExternalLink, Volume2 } from 'lucide-react';
import { YouTubeResult } from '@/services/searchService';
import { Button } from '@/components/ui/button';

interface YoutubeResultProps {
  video: YouTubeResult;
  onReadAloud?: () => void;
}

const YoutubeResult: React.FC<YoutubeResultProps> = ({ video, onReadAloud }) => {
  return (
    <div className="p-4 border rounded-elderly bg-white hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3 flex-shrink-0">
          <a 
            href={`https://www.youtube.com/watch?v=${video.videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-auto rounded-lg object-cover"
              loading="lazy"
            />
          </a>
        </div>
        <div className="md:w-2/3">
          <div className="flex justify-between items-start">
            <a 
              href={`https://www.youtube.com/watch?v=${video.videoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1"
            >
              <h3 className="text-elderly font-medium text-elder-blue hover:underline">{video.title}</h3>
              {video.channelTitle && (
                <p className="text-sm text-gray-500 mt-1">{video.channelTitle}</p>
              )}
              <p className="text-gray-700 mt-2">{video.description}</p>
            </a>
            
            <div className="flex items-start ml-2">
              <ExternalLink className="text-gray-400 flex-shrink-0" size={18} />
              
              {onReadAloud && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-auto ml-2 hover:bg-elder-blue-light hover:text-white rounded-full flex items-center gap-1"
                  onClick={onReadAloud}
                  aria-label="Read aloud"
                >
                  <Volume2 size={26} className="text-elder-blue" />
                  <span className="text-sm font-medium">Read</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeResult;
