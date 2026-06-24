import { ref } from 'vue'

export const useGemini = () => {
  const apiKey = "AIzaSyDqIKBWVp4ycwYwTAwHP7mLWtF4SMIEyMA"; // Masukkan API Key Anda di sini
  const isGenerating = ref(false);

  const generateText = async (prompt, retries = 5) => {
    isGenerating.value = true;
    const delays = [1000, 2000, 4000, 8000, 16000];
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // PERBAIKAN: Mengubah nama model menjadi 'gemini-2.5-flash' yang stabil
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
           systemInstruction: { 
          parts: [{ text: "You are a helpful AI assistant for an educational digital library. " +"Provide a very brief summary and key insight of the book in Indonesian. " +"Strictly limit your response to a maximum of 3-4 concise sentences or lines. No long lists." }] 
}
          })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        isGenerating.value = false;
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, respon tidak dapat di-generate.";
      } catch (error) {
        if (attempt === retries - 1) {
          isGenerating.value = false;
          return `Error: ${error.message}. Gagal terhubung ke Gemini API.`;
        }
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  };
  
  return { generateText, isGenerating };
};