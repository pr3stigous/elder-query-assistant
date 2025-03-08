
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { YouTubeResult } from '@/services/searchService';

interface YoutubeResultProps {
  video: YouTubeResult;
}

const YoutubeResult: React.FC<YoutubeResultProps> = ({ video }) => {
  return (
    <div className="p-4 border rounded-elderly bg-white hover:shadow-md transition-shadow">
      <a 
        href={`https://www.youtube.com/watch?v=${video.videoId}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3 flex-shrink-0">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-auto rounded-lg object-cover"
              loading="lazy"
            />
          </div>
          <div className="md:w-2/3">
            <div className="flex justify-between items-start">
              <h3 className="text-elderly font-medium text-elder-blue hover:underline">{video.title}</h3>
              <ExternalLink className="text-gray-400 flex-shrink-0 ml-2" size={18} />
            </div>
            {video.channelTitle && (
              <p className="text-sm text-gray-500 mt-1">{video.channelTitle}</p>
            )}
            <p className="text-gray-700 mt-2">{video.description}</p>
          </div>
        </div>
      </a>
    </div>
  );
};

export default YoutubeResult;
