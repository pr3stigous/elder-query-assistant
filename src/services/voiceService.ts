
import { toast } from '@/hooks/use-toast';

// Types for the service
export interface VoiceServiceConfig {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private openAIKey: string | null = null;
  private callbacks: VoiceServiceConfig = {};

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
      this.setupRecognition();
    }
  }

  setOpenAIKey(key: string) {
    this.openAIKey = key;
  }

  setCallbacks(config: VoiceServiceConfig) {
    this.callbacks = { ...this.callbacks, ...config };
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      this.callbacks.onTranscript?.(transcript);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      this.callbacks.onError?.(event.error);
      console.error('Speech recognition error:', event.error);
      
      toast({
        title: "Voice Recognition Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive"
      });
    };
  }

  startListening() {
    if (!this.recognition) {
      toast({
        title: "Voice Recognition Not Available",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    if (this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  async processWithLLM(text: string): Promise<string> {
    if (!this.openAIKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in settings",
        variant: "destructive"
      });
      return "Error: OpenAI API key is missing. Please add your key in the settings.";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for elderly users. Your purpose is to:
              1. Understand their query clearly
              2. Break down complex questions into simpler parts
              3. Provide clear, concise answers with larger font suggestions
              4. Always consider that your users may have hearing or vision impairments
              5. Use simple language and avoid technical terms
              Always respond in a warm, patient tone.`
            },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process with AI",
        variant: "destructive"
      });
      return "Sorry, I had trouble processing your request. Please try again.";
    }
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
