
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SearchResult } from '@/services/searchService';

interface SearchResultsProps {
  results: SearchResult[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={index} className="p-4 border rounded-elderly bg-white hover:shadow-md transition-shadow">
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-elderly font-medium text-elder-blue hover:underline">{result.title}</h3>
              <ExternalLink className="text-gray-400 flex-shrink-0 ml-2" size={18} />
            </div>
            <p className="text-sm text-gray-500 mt-1 truncate">{result.url}</p>
            <p className="text-gray-700 mt-2">{result.content.substring(0, 200)}...</p>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
