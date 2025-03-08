
import { toast } from '@/hooks/use-toast';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface YouTubeResult {
  title: string;
  videoId: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
}

interface TavilySearchResponse {
  results: SearchResult[];
  query: string;
}

class SearchService {
  private tavilyApiKey: string | null = null;

  setTavilyApiKey(key: string) {
    this.tavilyApiKey = key;
  }

  private validateApiKey(): boolean {
    if (!this.tavilyApiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your Tavily API key in settings",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }

  async performSearch(query: string): Promise<SearchResult[]> {
    if (!this.validateApiKey()) {
      return [];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tavilyApiKey}`
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          include_domains: [],
          exclude_domains: [],
          max_results: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: TavilySearchResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to perform search",
        variant: "destructive"
      });
      return [];
    }
  }

  async searchYouTube(query: string): Promise<YouTubeResult[]> {
    if (!this.validateApiKey()) {
      return [];
    }

    try {
      // YouTube search using Tavily API
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tavilyApiKey}`
        },
        body: JSON.stringify({
          query: `${query} youtube video`,
          search_depth: 'advanced',
          include_domains: ['youtube.com'],
          max_results: 3
        })
      });

      if (!response.ok) {
        throw new Error(`YouTube search failed: ${response.statusText}`);
      }

      const data: TavilySearchResponse = await response.json();
      
      // Transform and filter the results
      const youtubeResults = data.results
        .filter(result => result.url.includes('youtube.com/watch?v='))
        .map(result => {
          // Extract video ID from URL
          const videoId = result.url.split('v=')[1]?.split('&')[0] || '';
          
          return {
            title: result.title,
            videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            channelTitle: '', // Not available from Tavily results
            description: result.content.substring(0, 150) + '...'
          };
        });

      return youtubeResults;
    } catch (error) {
      console.error('YouTube search error:', error);
      toast({
        title: "YouTube Search Failed",
        description: error instanceof Error ? error.message : "Failed to search YouTube",
        variant: "destructive"
      });
      return [];
    }
  }
}

// Export a singleton instance
export const searchService = new SearchService();
