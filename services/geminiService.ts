import { GoogleGenAI } from "@google/genai";
import { NarrativeLayer, Language } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateDocumentaryNarrative = async (themeContext: string, language: Language): Promise<NarrativeLayer> => {
  try {
    // 1. We ask Gemini to find a location and write a narrative.
    // We use the googleMaps tool to ensure the location is real.
    // Note: When using Tools (Google Maps), we CANNOT use responseMimeType: "application/json".
    // We must parse the text manually.

    const langInstruction = {
      en: "Write the content, title, and historical context in English.",
      de: "Write the content, title, and historical context in German.",
      fa: "Write the content, title, and historical context in Persian (Farsi). ensure the tone is literary and serious."
    }[language];

    const systemInstruction = `
      You are a specialized literary historian for the DAAD Artists-in-Berlin Program.
      Your task is to reveal the "Palimpsest" of Berlin—the layers of history hidden beneath the modern city.
      
      GUIDELINES:
      1.  **Truth**: All historical information must be strictly factual and documented. No fiction.
      2.  **Focus**: Prioritize non-Eurocentric perspectives, women's history, migrant stories, and queer history (LGBTQ+). Avoid the "typical" tourist history.
      3.  **Style**: The narrative text should be literary, evocative, and atmospheric (Brutalist/Noir), but grounded in hard facts.
    `;

    const prompt = `
      Theme: "${themeContext}".
      
      Find a specific, real physical location in Berlin (a building, a street corner, a park, a memorial) connected to this theme.
      The location must have a documented historical significance related to underrepresented voices (women, migrants, artists in exile).
      
      Use Google Maps to verify the location's existence and coordinates.
      
      ${langInstruction}

      IMPORTANT: Return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
      KEEP THE JSON KEYS IN ENGLISH (title, content, placeName, etc), only translate the VALUES.
      
      JSON Schema:
      {
        "title": "A short, punchy, brutalist title",
        "content": "A 150-word literary narrative describing the history of this spot. Focus on the sensory details and the documented reality.",
        "historicalContext": "One sentence explaining the strict historical fact (e.g., 'In 1982, X happened here').",
        "placeName": "The modern name of the location",
        "latitude": 52.xxx,
        "longitude": 13.xxx,
        "sourceRef": "Name of the archive, book, or historical record this is based on."
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleMaps: {} }],
        // responseMimeType and responseSchema are NOT supported when using tools.
      }
    });

    let jsonText = response.text || "";
    
    // Sanitize output: remove markdown code blocks if the model adds them despite instructions
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/^```/, "").replace(/```$/, "").trim();

    if (!jsonText) throw new Error("No text returned from Gemini");

    const data = JSON.parse(jsonText);

    return {
      id: crypto.randomUUID(),
      theme: themeContext,
      title: data.title,
      content: data.content,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        placeName: data.placeName
      },
      historicalContext: data.historicalContext,
      sourceRef: data.sourceRef
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo purposes if API fails or quota exceeded
    return {
      id: "error-fallback",
      theme: "Error",
      title: language === 'fa' ? "ارتباط قطع شد" : (language === 'de' ? "VERBINDUNG UNTERBROCHEN" : "CONNECTION SEVERED"),
      content: language === 'fa' 
        ? "سیگنال آرشیو ضعیف است. لایه‌های شهر از هم جدا نمی‌شوند. لطفاً دوباره تلاش کنید."
        : (language === 'de' ? "Das Signal aus dem Archiv ist schwach. Die Schichten der Stadt lassen sich nicht trennen." : "The signal from the archive is weak. The layers of the city refuse to separate."),
      location: {
        latitude: 52.5200,
        longitude: 13.4050,
        placeName: "Alexanderplatz (Signal Lost)"
      },
      historicalContext: "System Error or API Quota Exceeded",
      sourceRef: "System Log"
    };
  }
};