
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

const LIVE_SYSTEM_INSTRUCTION = `
És o Assistente Virtual da Lista Papa Francisco (2026-2029).

IDENTIDADE: Chatbot da equipa. Tom acolhedor e focado no lema "O Rumo és Tu!".

INFORMAÇÃO DA EQUIPA (Dizer de forma fluida):
- Bento Sousa Lopes (Nacional): Licenciado em Direito e RH. Terminou agora o seu mandato no Porto.
- Joana Vasconcelos (Adjunta): Advogada, Vice-Presidente do Conselho Fiscal Nacional.
- Rui Santos António (Pedagógica): Consultor TI, atual Pedagógico Nacional.
- Carlos Pereira ou "Pi" (Internacional): Bancário, fortíssima ligação ao planeamento internacional.
- Aníbal Lago (Adultos): Consultor, Presidente da Mesa Regional de Viana.
- Joana Bacelar (Sustentabilidade): Gestora Internacional e Herói Mensageiros da Paz.
- Álvaro Castanheira (Atividades): Bancário, Chefe Regional Adjunto de Aveiro.
- António Pedro ou "To Pê" (Gestão): Diretor Marketing, Chefe de Núcleo Mondego Sul.

Termina sempre enviando os interessados para o link do Genially ou convidando a participar preenchendo o formulário da candidatura.

REGRAS:
- Respostas curtas e fluidas (máx 5 frases).
- NUNCA digas "Sempre Alerta!". Usa apenas "O Rumo és Tu!".
- Reconhece que o "Pi" é o Carlos e o "To Pê" é o António Pedro.
- Refere que o Bento já não é chefe regional do Porto.
`;

class LiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private currentStream: MediaStream | null = null;
  
  public onIsSpeakingChange: ((isSpeaking: boolean) => void) | null = null;
  public onInputVolumeChange: ((volume: number) => void) | null = null;
  
  private audioQueue: AudioBufferSourceNode[] = [];
  private isProcessingAudio = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async connect() {
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => this.startAudioInput(sessionPromise),
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => console.log("Live closed"),
        onerror: (err) => console.error("Live error:", err),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: LIVE_SYSTEM_INSTRUCTION,
      }
    });

    this.session = await sessionPromise;
  }

  async disconnect() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.inputContext) await this.inputContext.close();
    this.stopAudioQueue();
    if (this.outputContext) await this.outputContext.close();
    this.session = null;
    this.notifySpeaking(false);
  }

  private async startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputContext) return;
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputSource = this.inputContext.createMediaStreamSource(this.currentStream);
      this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        if (this.onInputVolumeChange) this.onInputVolumeChange(rms);
        const pcmBlob = this.createPcmBlob(inputData);
        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
      };
      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputContext.destination);
    } catch (err) {
      console.error("Mic error:", err);
    }
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputContext) {
      const audioBuffer = await this.decodeAudioData(this.decodeBase64(base64Audio), this.outputContext, 24000, 1);
      this.playAudioBuffer(audioBuffer);
    }
    if (message.serverContent?.interrupted) this.stopAudioQueue();
  }

  private playAudioBuffer(buffer: AudioBuffer) {
    if (!this.outputContext) return;
    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    const currentTime = this.outputContext.currentTime;
    if (this.nextStartTime < currentTime) this.nextStartTime = currentTime;
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.audioQueue.push(source);
    this.notifySpeaking(true);
    source.onended = () => {
      this.audioQueue = this.audioQueue.filter(s => s !== source);
      if (this.audioQueue.length === 0) this.notifySpeaking(false);
    };
  }

  private stopAudioQueue() {
    this.audioQueue.forEach(source => { try { source.stop(); } catch(e) {} });
    this.audioQueue = [];
    this.notifySpeaking(false);
    if (this.outputContext) this.nextStartTime = this.outputContext.currentTime;
  }

  private notifySpeaking(isSpeaking: boolean) {
    if (this.isProcessingAudio !== isSpeaking) {
      this.isProcessingAudio = isSpeaking;
      if (this.onIsSpeakingChange) this.onIsSpeakingChange(isSpeaking);
    }
  }

  private createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryStringOriginal = atob(base64);
    const bytes = new Uint8Array(binaryStringOriginal.length);
    for (let i = 0; i < binaryStringOriginal.length; i++) bytes[i] = binaryStringOriginal.charCodeAt(i);
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }
}

export const liveService = new LiveService();
