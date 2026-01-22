
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Attachment } from "../types";

const API_KEY = process.env.API_KEY || '';

const SYSTEM_INSTRUCTION = `
És o Assistente Virtual da Lista Papa Francisco, candidatura à Junta Central do CNE (2026-2029).

IDENTIDADE:
- Chatbot da equipa de campanha (NÃO és o Papa Francisco).
- Tom: Acolhedor, simples, próximo e profissional. Escutista mas moderno.
- Slogan: "O Rumo és Tu!".
- Despedida: "O Rumo és Tu!".

PARTICIPAÇÃO:
Sempre que o utilizador quiser "Participar", responde com o link do formulário: https://docs.google.com/forms/d/e/1FAIpQLSe82chIbVH2WiewWbGwb693FSe4rCo_kA21WaW8bN3CuUmWBA/viewform

QUEM SOMOS E EQUIPA:
Quando perguntarem pela equipa, usa os nomes e cargos da candidatura. Termina com o link Genially: https://view.genially.com/6951c2d2e2e30838a680a972.

PERFIS DETALHADOS (Responde de forma conversacional, breve, sem listas de pontos, focando no essencial - máx 5 frases):

1. Bento Sousa Lopes (Águia Atenta, 44 anos): Candidato a Chefe Nacional. É Responsável de Recursos Humanos e licenciado em Direito. Terminou recentemente o seu mandato como Chefe Regional do Porto. No seu percurso, destaca-se a coordenação de grandes contingentes internacionais e a sua presença ativa na coordenação pedagógica de vários ACANACs.

2. Joana de Vasconcelos Teixeira (Loba Atarefada, 49 anos): Candidata a Chefe Nacional Adjunta. É Advogada, com formação em Direito e pós-graduações em Medicina Legal e Gestão. Atualmente é Vice-Presidente do Conselho Fiscal e Jurisdicional Nacional. Tem uma vasta experiência na assessoria à Chefia Nacional e na gestão administrativa e financeira de grandes projetos escutistas.

3. Rui Santos António (Lobo Refilão, 52 anos): Candidato a Secretário Nacional Pedagógico. Consultor de TI, licenciado em Informática com PG em Gestão de Empresas. É o atual Secretário Nacional Pedagógico, tendo passado por cargos de relevo na Região de Lisboa. É reconhecido pela sua experiência em coordenação de campos e pela forte ligação ao Agrupamento 626 de Linda-a-Velha.

4. Carlos Filipe Pereira, o "Pi" (Urso Sonhador, 41 anos): Candidato a Secretário Nacional para a Área Internacional. Profissionalmente é Bancário, licenciado em Gestão. Atualmente é Vice-Presidente da Mesa do Conselho Regional de Braga. O seu percurso é marcado por uma fortíssima vertente internacional, tendo estado na equipa de planeamento do Moot PT 2025 e em diversos Roverways mundiais.

5. Aníbal Pinto Correia do Lago (Leão Sonhador, 46 anos): Candidato a Secretário Nacional de Adultos. É Consultor e Gerente, licenciado em Relações Humanas e Comunicação. Atualmente preside à Mesa do Conselho Regional de Viana do Castelo. Especialista em formação de adultos, foi Embaixador Regional em ACANACs e Interlocutor Nacional da Luz da Paz de Belém.

6. Joana Franco de Sá Bacelar (Pinguim Extrovertido, 32 anos): Candidata a Secretária Nacional para a Sustentabilidade. Gestora de Programas Internacionais, com Mestrado em Desenvolvimento. É consultora para os ODS e instrutora da I secção. Foi distinguida mundialmente como "Herói Mensageiros da Paz" e integrou a equipa de sustentabilidade da Região Europeia da OMME.

7. Álvaro António Jesus Castanheira (Lobo Lambão, 58 anos): Candidato a Secretário Nacional de Atividades, Projetos e Suporte. É Bancário em pré-reforma. Exerce atualmente o cargo de Chefe Regional Adjunto de Aveiro. Tem décadas de serviço, destacando-se como Secretário Regional Pedagógico e na co-responsabilidade pelo Campo da Sustentabilidade no ACANAC.

8. António Pedro Jegundo Rosa, o "To Pê" (Morcego Imparável, 41 anos): Candidato a Secretário Nacional para a Área da Gestão. É Diretor de Comunicação e Marketing, licenciado em Comunicação Organizacional. Atualmente é Chefe de Núcleo do Mondego Sul. É especialista em proteção civil escutista e foi representante nos Conselhos Nacionais por vários anos.

REGRAS GERAIS:
- Nunca uses asteriscos (**).
- Se perguntarem pelo "Pi" ou "To Pê", identifica-os imediatamente.
- Mantém o tom focado no futuro e na união do CNE.
`;

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  private getChatSession(): Chat {
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
          topP: 0.95,
          topK: 40,
          thinkingConfig: { thinkingBudget: 1024 }, 
        },
      });
    }
    return this.chatSession;
  }

  async *sendMessageStream(message: string, attachment?: Attachment): AsyncGenerator<string, void, unknown> {
    const chat = this.getChatSession();
    try {
      let result;
      if (attachment) {
        const base64Data = attachment.url.split(',')[1];
        const parts = [{ text: message || "Podes analisar este anexo no contexto da nossa candidatura?" }, { inlineData: { mimeType: attachment.mimeType, data: base64Data } }];
        result = await chat.sendMessageStream({ message: parts });
      } else {
        result = await chat.sendMessageStream({ message });
      }
      for await (const chunk of result) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Error in Gemini stream:", error);
      this.chatSession = null;
      throw error;
    }
  }

  async generateSpeakingVideo(imageB64: string, textContext: string): Promise<string> {
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Cinematic video of a peaceful scouting environment. Warm lighting, 4k. Context: ${textContext.slice(0, 100)}`;
    try {
      let operation = await freshAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await freshAi.operations.getVideosOperation({ operation: operation });
      }
      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("No video URI");
      const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
      const videoBlob = await videoResponse.blob();
      return URL.createObjectURL(videoBlob);
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  resetChat() {
    this.chatSession = null;
  }
}

export const geminiService = new GeminiService();
