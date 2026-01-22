
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Mic, Paperclip, X, Image as ImageIcon, Music, Sparkles, AudioLines } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string, file?: File) => void;
  onStartLive: () => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, onStartLive, isLoading }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;
    onSend(input, selectedFile || undefined);
    setInput('');
    clearFile();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSuggestion = (text: string) => onSend(text);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [input]);

  const isAudio = selectedFile?.type.startsWith('audio/');
  const isImage = selectedFile?.type.startsWith('image/');

  const suggestions = [
    { label: "🌱 Azimutes", text: "Quais são as propostas da candidatura?" },
    { label: "👥 Equipa", text: "Quem faz parte da equipa?" },
    { label: "📅 Apresentações", text: "Quando são as apresentações?" },
  ];

  return (
    <div className="bg-transparent fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient fade effect to separate messages from buttons */}
      <div className="h-12 bg-gradient-to-t from-parchment dark:from-dark-surface to-transparent pointer-events-none" />
      
      <div className="bg-parchment/90 dark:bg-dark-surface/90 backdrop-blur-md px-4 pb-8 md:pb-10 pt-2">
        <div className="max-w-4xl mx-auto">
          {/* Suggestions Bar */}
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide px-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestion(suggestion.text)}
                disabled={isLoading}
                className="flex-shrink-0 px-6 py-3 bg-white dark:bg-slate-800 border border-cne-gold/20 dark:border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-cne-blue dark:text-cne-gold-light hover:bg-cne-gold hover:text-white dark:hover:text-slate-900 transition-all shadow-lg whitespace-nowrap active:scale-95 flex items-center gap-2"
              >
                <Sparkles size={14} className="text-cne-gold group-hover:text-white" />
                {suggestion.label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-4 bg-white dark:bg-slate-900 glass-effect p-3 rounded-[32px] shadow-2xl border border-cne-gold/10 dark:border-white/5">
            <button
              onClick={onStartLive}
              disabled={isLoading}
              className="p-5 rounded-2xl bg-gradient-to-br from-cne-gold to-orange-400 text-white hover:shadow-gold-glow hover:scale-105 transition-all flex-shrink-0 shadow-lg active:scale-90 group"
              title="Ligar por Voz"
            >
              <Mic size={26} className="group-hover:animate-pulse" />
            </button>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-slate-100 dark:border-white/5 shadow-inner flex flex-col transition-all focus-within:ring-2 focus-within:ring-cne-blue/10">
              {selectedFile && (
                <div className="flex items-center gap-4 mb-3 bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-100 dark:border-white/5 animate-in zoom-in duration-300">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                    {isImage && previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
                    {isAudio && <AudioLines className="text-cne-blue dark:text-cne-gold" size={28} />}
                    {!isImage && !isAudio && <Paperclip className="text-slate-400" size={28} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-200 truncate font-bold">{selectedFile.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Anexo pronto</p>
                  </div>
                  <button onClick={clearFile} className="p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-3 w-full">
                <div className="relative flex-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,audio/*" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute left-1 bottom-1 p-2 text-slate-400 hover:text-cne-blue dark:hover:text-cne-gold transition-colors"
                    title="Anexar"
                  >
                    <Paperclip size={22} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva a sua mensagem..."
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 pl-10 pr-3 max-h-[180px] outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 font-serif text-lg leading-snug"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => handleSubmit()}
                  disabled={(!input.trim() && !selectedFile) || isLoading}
                  className="p-4 rounded-xl bg-cne-blue dark:bg-cne-gold text-white dark:text-slate-900 hover:scale-105 disabled:opacity-20 shadow-lg transition-all active:scale-90"
                >
                  {isLoading ? <Sparkles size={24} className="animate-spin" /> : <SendHorizontal size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
