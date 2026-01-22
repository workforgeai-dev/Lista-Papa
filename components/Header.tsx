
import React from 'react';
import { RefreshCw, Sparkles, Compass } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-gradient-to-r from-cne-blue-dark via-cne-blue to-cne-blue-light shadow-2xl px-6 py-5 flex items-center justify-between z-40 sticky top-0 text-white border-b-[6px] border-cne-gold animate-in slide-in-from-top duration-700">
      <div className="flex flex-col items-center text-center flex-1">
        <div className="flex items-center gap-4 mb-2">
          <div className="hidden md:block">
            <Compass className="text-cne-gold animate-[spin_10s_linear_infinite]" size={24} />
          </div>
          <h1 className="serif-font text-2xl md:text-4xl font-black leading-none tracking-[0.1em] text-white uppercase drop-shadow-xl">
            Lista Papa Francisco
          </h1>
          <div className="hidden md:block">
            <Sparkles className="text-cne-gold animate-pulse" size={24} />
          </div>
        </div>
        
        <p className="text-[10px] md:text-xs text-white/80 font-bold tracking-[0.4em] uppercase mb-2">
          Candidatura Junta Central CNE 2026-2029
        </p>
        
        <div className="bg-white/10 glass-effect px-8 py-1.5 rounded-full border border-white/20 shadow-inner mt-1">
          <p className="serif-font text-xs md:text-sm font-bold text-cne-gold-light italic tracking-wider">
            "O Rumo és Tu!" 🏕️
          </p>
        </div>
      </div>
      
      <button 
        onClick={onReset}
        className="absolute right-6 p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-all flex-shrink-0 active:scale-90 shadow-xl bg-black/20 group backdrop-blur-sm border border-white/10"
        title="Reiniciar Conversa"
      >
        <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700 text-cne-gold" />
      </button>
    </header>
  );
};
