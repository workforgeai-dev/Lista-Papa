
import React, { useState } from 'react';
import { Message } from '../types';
import { User, Video, Loader2, Copy, Check, Mail, Instagram, Share2, FileText, Presentation, Compass } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { urlToBase64 } from '../utils';
import { RichCard } from './RichCard';

interface MessageBubbleProps {
  message: Message;
  onCardAction?: (val: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCardAction }) => {
  const isUser = message.role === 'user';
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderSpecialContent = () => {
    if (isUser || message.isStreaming) return null;
    const lowerText = message.text.toLowerCase();

    // Removido o grid visual da equipa (quadradinhos)

    if (lowerText.includes("contact") || lowerText.includes("redes sociais") || lowerText.includes("email")) {
      return (
        <div className="flex flex-wrap gap-3 mt-6">
          <button className="flex items-center gap-3 px-6 py-3 bg-cne-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cne-blue-dark transition-all shadow-xl hover:-translate-y-1 active:scale-95" onClick={() => window.open('mailto:equipapapafrancisco.cne@gmail.com')}>
            <Mail size={18} /> Contactar
          </button>
          <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-tr from-yellow-500 to-pink-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl hover:-translate-y-1 active:scale-95" onClick={() => window.open('https://instagram.com/papafrancisco_2629', '_blank')}>
            <Instagram size={18} /> Instagram
          </button>
        </div>
      );
    }
    return null;
  };

  if (isUser) {
    return (
      <div className="user-message-container">
        <div className="user-message">
          <div className="text-base md:text-lg whitespace-pre-wrap font-medium leading-relaxed">{message.text}</div>
          {message.attachment && (
            <div className="mt-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
               {message.attachment.type === 'image' && <img src={message.attachment.url} className="w-full max-w-sm object-cover" />}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bot-message-container">
      <div className="flex-shrink-0">
        <div className="papa-avatar bg-cne-blue group">
          <span className="text-white font-black text-2xl group-hover:scale-110 transition-transform">PF</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="bot-message">
          <div className="serif-font text-lg md:text-2xl text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap mb-4">
            {message.text}
          </div>

          {renderSpecialContent()}

          {message.quickReplies && message.quickReplies.length > 0 && !message.isStreaming && (
            <div className="flex flex-wrap gap-3 mt-8">
              {message.quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => onCardAction?.(qr.action)}
                  className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-cne-blue dark:text-cne-gold hover:bg-cne-blue hover:text-white dark:hover:bg-cne-gold dark:hover:text-black transition-all shadow-sm flex items-center gap-3 active:scale-95"
                >
                  {qr.emoji && <span className="text-xl">{qr.emoji}</span>}
                  {qr.text}
                </button>
              ))}
            </div>
          )}
          
          {message.cards && message.cards.length > 0 && (
            <div className="flex gap-6 overflow-x-auto pb-6 pt-10 scrollbar-hide -mx-8 px-8">
              {message.cards.map((card, idx) => (
                <RichCard key={idx} card={card} onAction={onCardAction} />
              ))}
            </div>
          )}
        </div>

        {message.isStreaming && (
          <div className="typing-indicator bg-white/50 dark:bg-slate-800/50 glass-effect px-6 py-3 rounded-2xl w-fit ml-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Compass className="text-cne-gold animate-spin" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">A processar</span>
              <div className="flex gap-1.5 ml-2">
                <span className="w-1.5 h-1.5 bg-cne-gold rounded-full animate-bounce [animation-duration:1s]"></span>
                <span className="w-1.5 h-1.5 bg-cne-gold rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-cne-gold rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        {!message.isStreaming && message.text && (
          <div className="flex items-center gap-4 ml-4 mt-2">
            <button 
              onClick={handleCopy} 
              className="group text-slate-400 hover:text-cne-blue dark:hover:text-cne-gold flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all bg-white/40 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl hover:shadow-md"
            >
              {isCopied ? <Check size={14} className="text-cne-green" /> : <Copy size={14} className="group-hover:scale-110 transition-transform" />}
              {isCopied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
