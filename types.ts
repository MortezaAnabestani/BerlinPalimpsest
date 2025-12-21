
export interface LocationData {
  latitude: number;
  longitude: number;
  placeName: string;
}

export interface NarrativeLayer {
  id: string;
  theme: string;
  title: string;
  content: string; // The literary documentary text
  location: LocationData;
  historicalContext: string; // Brief metadata about the event/person
  sourceRef: string; // Source of the documentary fact
}

export interface GhostPersona {
  role: string; // e.g., "Anxious Student", "Stasi Officer"
  monologue: string; // "My hands are shaking..."
  x: number; // Percentage coordinate (0-100)
  y: number; // Percentage coordinate (0-100)
}

export type AppState = 'MANIFESTO' | 'SCANNING' | 'LOCATED' | 'READING' | 'DREAMING' | 'SUMMONED';

export type Language = 'en' | 'de' | 'fa';

export interface ThemeOption {
  id: string;
  label: {
    en: string;
    de: string;
    fa: string;
  };
  promptContext: string;
}