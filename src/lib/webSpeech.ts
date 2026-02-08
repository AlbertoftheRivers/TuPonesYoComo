/**
 * Web Speech API for voice dictation in web browsers
 */

export interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition;
    webkitSpeechRecognition: new () => WebSpeechRecognition;
  }
}

/**
 * Check if Web Speech API is available
 */
export function isWebSpeechAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Create a SpeechRecognition instance
 */
export function createSpeechRecognition(): WebSpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  
  return new SpeechRecognition();
}

/**
 * Start voice dictation using Web Speech API
 */
export function startWebSpeechRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
  language: string = 'es-ES'
): WebSpeechRecognition | null {
  const recognition = createSpeechRecognition();
  if (!recognition) {
    onError('Web Speech API no está disponible en este navegador');
    return null;
  }

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;

  let finalTranscript = '';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    onResult(finalTranscript + interimTranscript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError(event.error === 'no-speech' ? 'No se detectó habla' : event.message || 'Error de reconocimiento');
  };

  recognition.onend = () => {
    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    }
  };

  try {
    recognition.start();
    return recognition;
  } catch (error) {
    onError('No se pudo iniciar el reconocimiento de voz');
    return null;
  }
}

