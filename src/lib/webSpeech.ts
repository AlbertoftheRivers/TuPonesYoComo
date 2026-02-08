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
  recognition.interimResults = false; // No mostrar resultados intermedios
  recognition.lang = language;

  let finalTranscript = '';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    // Solo procesar resultados finales, no intermedios
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript;
        finalTranscript += transcript + ' ';
      }
    }
    // Guardar en el objeto recognition para acceso externo
    (recognition as any)._finalTranscript = finalTranscript;
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError(event.error === 'no-speech' ? 'No se detectó habla' : event.message || 'Error de reconocimiento');
  };

  recognition.onend = () => {
    // Solo cuando termine, devolver todo el texto acumulado
    const text = (recognition as any)._finalTranscript || finalTranscript;
    if (text && text.trim()) {
      onResult(text.trim());
    } else {
      onError('No se detectó ningún texto');
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

