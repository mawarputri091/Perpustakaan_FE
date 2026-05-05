import { ref } from 'vue'

export const useGemini = () => {
  const apiKey = ""; // Masukkan API Key Anda di sini
  const isGenerating = ref(false);

  const generateText = async (prompt) => {
    isGenerating.value = true;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "You are a helpful AI assistant for an educational digital library." }] }
        })
      });
      const result = await response.json();
      isGenerating.value = false;
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, respon tidak tersedia.";
    } catch (error) {
      isGenerating.value = false;
      return `Error: Gagal terhubung ke AI.`;
    }
  };
  
  return { generateText, isGenerating };
};