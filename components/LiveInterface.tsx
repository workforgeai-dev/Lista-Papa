
import React, { useEffect, useState } from 'react';
import { Mic, PhoneOff, AlertCircle, RefreshCw, AudioLines, Loader2 } from 'lucide-react';
import { liveService } from '../services/live';

interface LiveInterfaceProps {
  onClose: () => void;
}

export const LiveInterface: React.FC<LiveInterfaceProps> = ({ onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    liveService.onIsSpeakingChange = (speaking) => {
      setIsSpeaking(speaking);
    };

    liveService.onInputVolumeChange = (volume) => {
        setInputVolume(prev => prev * 0.8 + volume * 0.2);
    };

    const startSession = async () => {
      setIsConnecting(true);
      setError(null);
      try {
        await liveService.connect();
      } catch (e) {
        console.error("Failed to connect live session", e);
        setError("Não foi possível estabelecer a ligação. Verifique a sua conexão de rede.");
      } finally {
        setIsConnecting(false);
      }
    };

    startSession();

    return () => {
      liveService.disconnect();
    };
  }, []);

  const handleRetry = () => {
    setIsConnecting(true);
    setError(null);
    liveService.connect()
      .then(() => {
        setIsConnecting(false);
      })
      .catch(e => {
        console.error("Retry failed", e);
        setIsConnecting(false);
        setError("Ainda não conseguimos ligar. Tente novamente mais tarde.");
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-cne-blue to-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      <div className="absolute top-12 text-center">
         <h2 className="serif-font text-2xl text-white font-bold mb-1">Chamada Direta</h2>
         <p className="text-cne-gold text-xs font-black tracking-widest uppercase">Lista Papa Francisco</p>
      </div>

      <div className="relative flex items-center justify-center w-full max-w-md my-8 min-h-[320px]">
        
        {error ? (
          <div className="flex flex-col items-center text-center p-8 bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-red-500/20 animate-in zoom-in-95 duration-200 max-w-sm">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-sm">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Ligação Interrompida</h3>
            <p className="text-stone-600 mb-8 leading-relaxed text-sm">{error}</p>
            <div className="flex gap-3 justify-center w-full">
              <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-3 bg-cne-gold text-white rounded-full font-bold hover:bg-cne-gold/80 transition-colors flex-1 justify-center"
              >
                <RefreshCw size={18} /> Tentar
              </button>
              <button 
                onClick={onClose}
                className="px-5 py-3 bg-stone-100 text-stone-600 rounded-full font-bold hover:bg-stone-200 transition-colors flex-1"
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            
            <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80 mb-6">
                {isConnecting && !isSpeaking && (
                   <div className="absolute inset-0 rounded-full border-4 border-dashed border-cne-gold/30 animate-[spin_10s_linear_infinite]" />
                )}

                {isSpeaking && (
                <>
                    <div className="absolute inset-0 rounded-full border-4 border-cne-gold opacity-20 animate-[ping_1.5s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 rounded-full border-2 border-cne-gold opacity-30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                    <div className="absolute -inset-4 rounded-full bg-cne-gold/10 opacity-20 animate-pulse" />
                </>
                )}

                <div className="absolute inset-2 rounded-full bg-cne-blue/30 backdrop-blur shadow-2xl" />

                <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-cne-gold shadow-xl shadow-cne-gold/20 z-10 transition-transform duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'} bg-cne-blue flex items-center justify-center`}>
                   {isConnecting && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 backdrop-blur-[2px]">
                       <Loader2 className="text-cne-gold animate-spin" size={48} />
                     </div>
                   )}
                   <span className="text-white font-black text-6xl md:text-8xl">PF</span>
                </div>

                <div className="absolute bottom-0 z-20 bg-cne-gold px-4 py-1.5 rounded-full shadow-lg border-2 border-white/20">
                <div className="flex items-center gap-2">
                    {isConnecting ? (
                        <>
                           <Loader2 size={14} className="text-white animate-spin" />
                           <span className="text-[10px] font-black uppercase text-white">A Ligar</span>
                        </>
                    ) : isSpeaking ? (
                        <>
                            <AudioLines size={14} className="text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white">A Falar</span>
                        </>
                    ) : (
                        <>
                            <div className={`w-2 h-2 rounded-full bg-white/50`} />
                            <span className="text-[10px] font-black uppercase text-white">A Ouvir</span>
                        </>
                    )}
                </div>
                </div>
            </div>

            {!isSpeaking && !isConnecting && (
                 <div className="flex flex-col items-center gap-4 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[80px] justify-center">
                    
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <div 
                            className="absolute inset-0 bg-cne-gold rounded-full opacity-20 transition-transform duration-75 ease-out"
                            style={{ transform: `scale(${1 + inputVolume * 12})` }}
                        />
                         <div 
                            className="absolute inset-0 bg-cne-gold rounded-full opacity-30 transition-transform duration-100 ease-out"
                            style={{ transform: `scale(${1 + inputVolume * 6})` }}
                        />
                        
                        <div className="relative w-full h-full bg-white rounded-full border-2 border-cne-gold flex items-center justify-center shadow-lg z-10 transition-colors duration-200">
                            <Mic size={24} className={inputVolume > 0.05 ? "text-cne-gold" : "text-stone-300"} />
                        </div>
                    </div>

                    <p className={`text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${inputVolume > 0.02 ? 'text-cne-gold translate-y-0 opacity-100' : 'text-white/20 -translate-y-1 opacity-50'}`}>
                        {inputVolume > 0.02 ? "A detetar voz..." : "..."}
                    </p>
                 </div>
            )}
          </div>
        )}
      </div>

      {!error && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <button 
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl hover:bg-red-700 transition-transform hover:scale-110 active:scale-95 border-4 border-white/20"
            aria-label="Desligar"
            title="Terminar Chamada"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}
      
      {!error && (
        <p className="absolute bottom-8 text-white/40 text-[10px] font-bold uppercase tracking-widest max-w-xs text-center">
          "O Rumo és Tu!" ⚜️
        </p>
      )}

    </div>
  );
};
