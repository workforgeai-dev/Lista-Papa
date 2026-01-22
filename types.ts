export interface Attachment {
  type: 'image' | 'audio';
  url: string; // Base64 Data URL for display/playback
  mimeType: string;
}

export interface QuickReply {
  text: string;
  action: string;
  emoji?: string;
}

export interface RichCard {
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  actionValue?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  attachment?: Attachment;
  cards?: RichCard[];
  quickReplies?: QuickReply[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}