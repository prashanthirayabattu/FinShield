import type { SupportedLanguage } from '../i18n/types';
import { LANGUAGE_LOCALE_MAP } from '../utils/voiceCommandParser';

// Type definitions for Web Speech API
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'PREVIEW'
  | 'CONFIRMING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'ERROR';

export class VoiceAssistantService {
  private recognition: SpeechRecognitionInstance | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private isSpeaking = false;

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public startListening({
    language,
    onStart,
    onResult,
    onError,
    onEnd,
  }: {
    language: SupportedLanguage;
    onStart?: () => void;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (errorCode: 'micPermissionDenied' | 'noSpeechDetected' | 'unsupported' | 'commandUnclear') => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      onError('unsupported');
      return false;
    }

    this.stopListening();
    this.stopSpeaking();

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!RecognitionClass) {
      onError('unsupported');
      return false;
    }

    try {
      this.recognition = new RecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = LANGUAGE_LOCALE_MAP[language] || 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const text = final || interim;
        if (text) {
          onResult(text.trim(), !!final);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onError('micPermissionDenied');
        } else if (event.error === 'no-speech') {
          onError('noSpeechDetected');
        } else {
          onError('commandUnclear');
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch {
      onError('commandUnclear');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  public speak({
    text,
    language,
    onStart,
    onEnd,
    onError,
  }: {
    text: string;
    language: SupportedLanguage;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: Error) => void;
  }): void {
    if (!this.isSpeechSynthesisSupported() || !text.trim()) {
      onEnd?.();
      return;
    }

    this.stopSpeaking();

    try {
      const cleanText = text
        .replace(/[*_#`]/g, '')
        .replace(/₹\s*/g, 'rupees ')
        .slice(0, 350); // Keep spoken response concise

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLocale = LANGUAGE_LOCALE_MAP[language] || 'en-IN';
      utterance.lang = targetLocale;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === targetLocale.toLowerCase() ||
          v.lang.toLowerCase().startsWith(language)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        onError?.(new Error(e.error || 'Speech synthesis error'));
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onError?.(err instanceof Error ? err : new Error('Speech synthesis failed'));
    }
  }

  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const voiceAssistant = new VoiceAssistantService();
