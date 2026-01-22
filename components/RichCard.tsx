
import React from 'react';
import { RichCard as RichCardType } from '../types';
import { ArrowRight, Compass, Shield, Users, Leaf, MessageSquare, Calendar, Star } from 'lucide-react';

interface RichCardProps {
  card: RichCardType;
  onAction?: (val: string) => void;
}

export const RichCard: React.FC<RichCardProps> = ({ card, onAction }) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'compass': return <Compass className="text-white" size={32} />;
      case 'shield': return <Shield className="text-white" size={32} />;
      case 'users': return <Users className="text-white" size={32} />;
      case 'leaf': return <Leaf className="text-white" size={32} />;
      case 'dialog': return <MessageSquare className="text-white" size={32} />;
      case 'calendar': return <Calendar className="text-white" size={32} />;
      default: return <Star className="text-white" size={32} />;
    }
  };

  return (
    <div className="azimute-card flex-shrink-0 w-80 bg-white dark:bg-dark-card rounded-[32px] shadow-premium overflow-hidden animate-fade-in-up">
      <div className="bg-gradient-to-br from-cne-blue to-cne-blue-dark p-6 flex items-center justify-between border-b-4 border-cne-gold relative overflow-hidden">
        {/* Subtle decorative circle */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
        
        <div className="flex flex-col relative z-10">
          <h4 className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">{card.subtitle || "Azimute"}</h4>
          <h3 className="serif-font font-bold text-xl text-white leading-tight mt-1 drop-shadow-md">
            {card.title}
          </h3>
        </div>
        <div className="bg-cne-gold p-4 rounded-2xl shadow-lg relative z-10 transform transition-transform group-hover:scale-110">
          {getIcon(card.icon)}
        </div>
      </div>
      
      <div className="p-8 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/50 dark:from-dark-card dark:to-slate-900/40">
        {card.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-10 flex-grow leading-relaxed font-medium">
            {card.description}
          </p>
        )}
        
        {card.actionLabel && (
          <button 
            onClick={() => onAction?.(card.actionValue || card.actionLabel!)}
            className={`group flex items-center justify-center gap-4 w-full py-4.5 bg-cne-blue/5 dark:bg-white/5 border border-cne-blue/10 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-cne-blue dark:text-cne-gold hover:bg-cne-gold dark:hover:bg-cne-gold hover:text-white dark:hover:text-black hover:border-cne-gold transition-all shadow-sm active:scale-95 ${!card.description ? 'mt-auto' : ''}`}
          >
            {card.actionLabel} 
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        )}
      </div>
    </div>
  );
};
