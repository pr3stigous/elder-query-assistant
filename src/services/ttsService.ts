
import { toast } from '@/hooks/use-toast';

class TTSService {
  private synth: SpeechSynthesis;
  private isReading: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  public speak(text: string): void {
    // First stop any current speech
    this.stop();

    if (!this.synth) {
      toast({
        title: "Speech Synthesis Not Available",
        description: "Your browser doesn't support speech synthesis.",
        variant: "destructive"
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for elderly users
    utterance.rate = 0.9; // Slightly slower rate
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a voice that sounds clear
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Daniel') ||
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      this.isReading = true;
    };
    
    utterance.onend = () => {
      this.isReading = false;
      this.currentUtterance = null;
    };
    
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      this.isReading = false;
      this.currentUtterance = null;
      
      toast({
        title: "Speech Synthesis Error",
        description: "There was an error while reading the text.",
        variant: "destructive"
      });
    };
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
  
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isReading = false;
      this.currentUtterance = null;
    }
  }
  
  public isCurrentlyReading(): boolean {
    return this.isReading;
  }
}

// Export singleton instance
export const ttsService = new TTSService();
