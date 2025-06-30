export interface VideoData {
  id: string;
  url: string;
  title: string;
  transcript: string;
  duration: string;
  thumbnail: string;
  channelTitle?: string;
  publishedAt?: string;
  segments?: TranscriptSegment[];
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevantTimestamp?: string;
}

export interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}