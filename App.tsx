
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/gemini';
import { Message, Attachment, RichCard, QuickReply } from './types';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { LiveInterface } from './components/LiveInterface';
import { generateId } from './utils';
import { 
  Menu, X, LayoutDashboard, Compass, Users, 
  Calendar, HelpCircle, Download, Instagram, 
  Moon, Sun, ChevronUp, Share2 
} from 'lucide-react';

const QUICK_REPLIES: QuickReply[] = [
  { emoji: "🏕️", text: "Ver Azimutes", action: "Quais são todos os 5 Azimutes da candidatura?" },
  { emoji: "👥", text: "Equipa", action: "Quem faz parte da equipa da Lista Papa Francisco?" },
  { emoji: "📧", text: "Contactar", action: "Como posso entrar em contacto com a vossa equipa?" },
    { emoji: '✋', text: 'Participar', action: 'Quero participar! Abri o formulário de participação' },
      { emoji: '❓', text: 'Quem somos', action: 'Quero saber mais sobre a equipa e a candidatura!' },
];

const WELCOME_MESSAGE_TEXT = `Olá! 👋 Sou o assistente da Lista Papa Francisco para a Junta Central do CNE (2026-2029).

Como posso ajudar-te hoje?`;

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: 'model',
  text: WELCOME_MESSAGE_TEXT,
  quickReplies: QUICK_REPLIES
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        setShowScrollTop(mainContentRef.current.scrollTop > 300);
      }
    };
    mainContentRef.current?.addEventListener('scroll', handleScroll);
    return () => mainContentRef.current?.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleReset = () => {
    if (window.confirm("Deseja reiniciar esta caminhada?")) {
      geminiService.resetChat();
      setMessages([INITIAL_MESSAGE]);
      setIsMenuOpen(false);
    }
  };

  const handleSendMessage = async (text: string, file?: File) => {
    setIsMenuOpen(false);
    let attachment: Attachment | undefined;

    if (file) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
      });
      reader.readAsDataURL(file);
      const url = await base64Promise;
      
      attachment = {
        type: file.type.startsWith('image/') ? 'image' : 'audio',
        mimeType: file.type,
        url: url
      };
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      text: text,
      attachment: attachment
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const modelMessageId = generateId();
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, modelMessage]);

    try {
      let accumulatedText = '';
      const stream = geminiService.sendMessageStream(text, attachment);

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
        )
      );

    } catch (error) {
      console.error("Failed to generate response", error);
      setMessages((prev) => [
        ...prev, 
        { 
          id: generateId(), 
          role: 'model', 
          text: 'Pedoa-me, mas a conexão falhou. Por favor, tenta novamente.' 
        }
      ]);
      setMessages((prev) => prev.filter(m => m.id !== modelMessageId || m.text.length > 0));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLive = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        if (!(await window.aistudio.hasSelectedApiKey())) return;
      }
    }
    setIsLiveActive(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lista Papa Francisco - Chat Assistente',
        text: 'Vê as propostas da Lista Papa Francisco para o CNE!',
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const menuItems = [
    { label: "Início", icon: <LayoutDashboard size={18} />, action: handleReset },
    { label: "Propostas", icon: <Compass size={18} />, action: () => handleSendMessage("Quais são os vossos 5 Azimutes?") },
    { label: "Equipa", icon: <Users size={18} />, action: () => handleSendMessage("Apresenta-me a equipa da candidatura.") },
    { label: "Agenda", icon: <Calendar size={18} />, action: () => handleSendMessage("Qual é a agenda da vossa campanha?") },
    { label: "FAQ", icon: <HelpCircle size={18} />, action: () => handleSendMessage("Perguntas frequentes.") },
    { label: "Instagram", icon: <Instagram size={18} />, action: () => window.open('https://instagram.com/papafrancisco_2629', '_blank') },
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden relative ${isDarkMode ? 'dark' : ''}`}>
      {isLiveActive && <LiveInterface onClose={() => setIsLiveActive(false)} />}
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-dark-card z-50 shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-cne-gold/20 flex flex-col`}>
        <div className="bg-cne-blue dark:bg-cne-blue-dark p-6 text-white border-b-4 border-cne-gold">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl">⚜️</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          <h2 className="serif-font text-lg font-bold uppercase tracking-widest leading-tight">Lista Papa Francisco</h2>
          <p className="text-[10px] text-cne-gold font-bold italic mt-1 uppercase">"O Rumo és Tu!"</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto bg-parchment-texture">
          <div className="space-y-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3 text-stone-700 dark:text-gray-300 hover:bg-cne-blue/10 dark:hover:bg-white/5 hover:text-cne-blue dark:hover:text-cne-gold rounded-xl transition-all font-bold text-sm group text-left"
              >
                <span className="text-cne-gold group-hover:scale-125 transition-transform">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        
        <div className="p-6 border-t border-stone-100 dark:border-white/10 bg-white dark:bg-dark-card text-center">
          <button onClick={handleShare} className="flex items-center gap-2 text-[10px] text-cne-blue dark:text-cne-gold font-black uppercase tracking-widest mx-auto hover:underline">
            <Share2 size={12} /> Partilhar Projeto
          </button>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-2">Candidatura à Junta Central 2026-2029</p>
        </div>
      </aside>
      
      <Header onReset={handleReset} />
      
      <div className="fixed right-6 top-24 z-30 flex flex-col gap-3">
        <button 
          onClick={toggleDarkMode}
          className="p-3 bg-white dark:bg-dark-card border-2 border-cne-gold rounded-full shadow-lg text-cne-blue dark:text-cne-gold hover:scale-110 transition-all active:scale-95"
          title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-3 bg-white dark:bg-dark-card border-2 border-cne-gold rounded-full shadow-lg text-cne-blue dark:text-cne-gold hover:scale-110 transition-all active:scale-95"
          title="Menu de Candidatura"
        >
          <Menu size={20} />
        </button>
      </div>

      <main 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth scrollbar-hide bg-parchment-texture"
      >
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end pt-12 pb-64">
          {messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onCardAction={handleSendMessage} 
            />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {showScrollTop && (
        <button 
          onClick={() => scrollToBottom()}
          className="fixed bottom-48 right-8 p-3 bg-cne-gold text-white rounded-full shadow-2xl animate-bounce hover:scale-110 transition-all z-20"
        >
          <ChevronUp size={24} />
        </button>
      )}

      <InputArea 
        onSend={handleSendMessage} 
        onStartLive={handleStartLive}
        isLoading={isLoading} 
      />
    </div>
  );
}
