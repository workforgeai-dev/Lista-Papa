export const generateId = () => Math.random().toString(36).substring(2, 9);

export const POPE_AVATAR_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pope_Francis_Korea_Haemi_Castle_19.jpg/440px-Pope_Francis_Korea_Haemi_Castle_19.jpg";

export const BP_QUOTES = [
  "O verdadeiro êxito de um homem não se mede pelo que conquistou, mas pelo legado que deixa.",
  "O escutismo é um jogo para rapazes, sob a direcção de rapazes, no qual os adultos são os irmãos mais velhos.",
  "A melhor maneira de ser feliz é contribuir para a felicidade dos outros.",
  "Deixai o mundo um pouco melhor do que o encontrastes.",
  "O homem que nunca cometeu um erro, nunca fez coisa alguma.",
  "Um sorriso é a chave secreta que abre muitos corações.",
  "Um escuteiro deve estar sempre pronto para qualquer emergência.",
  "Deus deu-nos um mundo para ser feliz, não para ser miserável."
];

export const getRandomQuote = () => BP_QUOTES[Math.floor(Math.random() * BP_QUOTES.length)];

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};