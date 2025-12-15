import React, { useState, useEffect } from 'react';
import { generateDocumentaryNarrative } from './services/geminiService';
import { SatelliteView } from './components/SatelliteView';
import { BrutalistButton, ManifestoCard, CoordinatesDisplay, GlitchTitle, TypewriterText } from './components/BrutalistUI';
import { NarrativeLayer, AppState, ThemeOption, Language } from './types';
import { MapPin, X, AlertTriangle, ScanLine, BookOpen, ArrowRight, Terminal, ExternalLink, Minus } from 'lucide-react';

const THEMES: ThemeOption[] = [
  { 
    id: 'exile', 
    label: { en: 'Voices in Exile', de: 'Stimmen im Exil', fa: 'صداهای در تبعید' }, 
    promptContext: 'Artists and intellectuals forced into exile in Berlin or from Berlin.' 
  },
  { 
    id: 'labor', 
    label: { en: 'Invisible Labor', de: 'Unsichtbare Arbeit', fa: 'کار نامرئی' }, 
    promptContext: 'The history of "Gastarbeiter" and migrant labor in Berlin.' 
  },
  { 
    id: 'resistance', 
    label: { en: 'Quiet Resistance', de: 'Stiller Widerstand', fa: 'مقاومت خاموش' }, 
    promptContext: 'Acts of everyday resistance by women or minorities during oppressive regimes.' 
  },
  { 
    id: 'queer', 
    label: { en: 'Queer Geographies', de: 'Queere Geografien', fa: 'جغرافیای کوئیر' }, 
    promptContext: 'Historical meeting places for the LGBTQ+ community in pre-war or divided Berlin.' 
  },
  {
    id: 'shadows',
    label: { en: 'Cold War Shadows', de: 'Schatten des Kalten Krieges', fa: 'سایه‌های جنگ سرد' },
    promptContext: 'Secret meeting points, dead drops, and surveillance locations during the division of Berlin.'
  },
  {
    id: 'squat',
    label: { en: 'Occupied Spaces', de: 'Besetzte Räume', fa: 'فضاهای اشغال‌شده' },
    promptContext: 'The history of the squatter movement (Hausbesetzer) and counter-culture art spaces in Kreuzberg and Mitte.'
  }
];

const TRANSLATIONS = {
  en: {
    title: "BERLIN PALIMPSEST",
    mission: "MISSION STATEMENT",
    missionTitle: "Every city is a text, rewritten over its past",
    missionText: "We invite you to excavate the narrative layers of Berlin. Beyond the Eurocentric facade lies a structure of hidden voices. Select a frequency to begin the excavation.",
    scanning: "TRIANGULATING HISTORICAL DATA...",
    searching: "SEARCHING ARCHIVES FOR NON-DOMINANT NARRATIVES",
    target: "Target Identified",
    evidence: "Documentary Evidence",
    context: "HISTORICAL CONTEXT",
    source: "Source Ref",
    status: "Status",
    statusValue: "ARCHIVE DECLASSIFIED",
    close: "Close File",
    manualInput: "MANUAL FREQUENCY INJECTION",
    inputPlaceholder: "Enter custom search parameter...",
    artisticStatementTitle: "MANIFESTO",
    artisticStatement: "This interface operates not as a map, but as a stratification device. We reject the static neutrality of cartography, asserting instead that every coordinate holds a suppressed frequency. By utilizing generative AI not as a creator, but as a spectral medium, we force the digital archive to speak its unconscious. This is an act of digital excavation to reveal the 'Palimpsest'—the text written over the erased past. We prioritize the glitch, the fragment, and the exile over the monument. This work explores the aesthetics of disappearance and the politics of memory in the algorithmic age.",
    developer: "Developed by Morteza Anabestani",
    role: "Founder of Codabiat (Persian Electronic Literature Group)"
  },
  de: {
    title: "BERLIN PALIMPSEST",
    mission: "LEITBILD",
    missionTitle: "Jede Stadt ist ein Text, überschrieben auf ihrer Vergangenheit",
    missionText: "Wir laden Sie ein, die erzählerischen Schichten Berlins auszugraben. Hinter der eurozentrischen Fassade liegt eine Struktur verborgener Stimmen. Wählen Sie eine Frequenz, um die Ausgrabung zu beginnen.",
    scanning: "TRIANGULIERUNG HISTORISCHER DATEN...",
    searching: "SUCHE IN ARCHIVEN NACH NICHT-DOMINANTEN NARRATIVEN",
    target: "Ziel Identifiziert",
    evidence: "Dokumentarischer Beweis",
    context: "HISTORISCHER KONTEXT",
    source: "Quelle",
    status: "Status",
    statusValue: "ARCHIV FREIGEGEBEN",
    close: "Akte Schließen",
    manualInput: "MANUELLE FREQUENZEINGABE",
    inputPlaceholder: "Suchparameter eingeben...",
    artisticStatementTitle: "MANIFEST",
    artisticStatement: "Diese Schnittstelle fungiert nicht als Karte, sondern als Stratifizierungsgerät. Wir lehnen die statische Neutralität der Kartografie ab und behaupten stattdessen, dass jede Koordinate eine unterdrückte Frequenz birgt. Indem wir generative KI nicht als Schöpfer, sondern als spektrales Medium nutzen, zwingen wir das digitale Archiv, sein Unbewusstes auszusprechen. Dies ist ein Akt der digitalen Ausgrabung, um das „Palimpsest“ zu enthüllen – den Text, der über die gelöschte Vergangenheit geschrieben wurde. Wir priorisieren den Glitch, das Fragment und das Exil gegenüber dem Monument.",
    developer: "Entwickelt von Morteza Anabestani",
    role: "Gründer von Codabiat (Persische Gruppe für elektronische Literatur)"
  },
  fa: {
    title: "پالیمپسست برلین",
    mission: "بیانیه مأموریت",
    missionTitle: "هر شهر متنی است، بازنویسی‌شده از متن‌های پیشین خود",
    missionText: "ما شما را به کاوش در لایه‌های روایی برلین دعوت می‌کنیم. فراتر از نمای اروپامحور، ساختاری از صداهای پنهان نهفته است. برای شروع کاوش، یک فرکانس را انتخاب کنید.",
    scanning: "مثلث‌بندی داده‌های تاریخی...",
    searching: "جستجو در آرشیو برای روایت‌های غیرغالب",
    target: "هدف شناسایی شد",
    evidence: "شواهد مستند",
    context: "زمینه تاریخی",
    source: "منبع",
    status: "وضعیت",
    statusValue: "آرشیو محرمانه نیست",
    close: "بستن پرونده",
    manualInput: "تزریق دستی فرکانس",
    inputPlaceholder: "پارامتر جستجوی دلخواه را وارد کنید...",
    artisticStatementTitle: "مانیفست",
    artisticStatement: "ما با رد کردن مفهوم شهر به مثابه یک واقعیت صلب و یکپارچه، برلین را به عنوان متنی در حال فروپاشی و بازنویسی قرائت می‌کنیم. این رابط کاربری یک نقشه نیست، بلکه دستگاهی برای لایه‌نگاری است. ما بر این باوریم که هر مختصات جغرافیایی، فرکانسی سرکوب‌شده را در خود دارد. هوش مصنوعی در اینجا نه یک ماشین تولید متن، بلکه یک مدیوم احضار ارواح است؛ ابزاری برای نفوذ به شکاف‌های میان تاریخ رسمی و روایت‌های حذف‌شده. این کنشی است از جنس باستان‌شناسیِ دیجیتال برای آشکارسازی «پالیمپسست»؛ متنی که بر روی گذشته‌ی پاک‌شده نوشته شده است. ما زیبایی‌شناسیِ گلیچ (Glitch)، قطعه‌وارگی و تبعید را بر تمامیت‌خواهیِ بناهای یادبود ارجح می‌دانیم.",
    developer: "توسعه‌دهنده: مرتضی آنابستانی",
    role: "موسس گروه کدابیات (گروه توسعه و آموزش ادبیات الکترونیک فارسی)"
  }
};

// Initial View: Berlin Center
const BERLIN_CENTER = { lat: 52.520008, lng: 13.404954 };

const App: React.FC = () => {
  // Default to Persian since the user requested it in Persian context
  const [language, setLanguage] = useState<Language>('fa');
  const [appState, setAppState] = useState<AppState>('MANIFESTO');
  const [currentNarrative, setCurrentNarrative] = useState<NarrativeLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFrequency, setCustomFrequency] = useState('');
  
  // State for the Manifesto/Credits box
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  
  // Coordinates for the view
  const [viewCoords, setViewCoords] = useState(BERLIN_CENTER);
  
  const t = TRANSLATIONS[language];
  const isRTL = language === 'fa';
  
  // Zoom Level calculation based on state
  const getZoomLevel = () => {
    switch(appState) {
      case 'MANIFESTO': return 12; // City View
      case 'SCANNING': return 13; // Searching View
      case 'LOCATED': return 17; // Street Level
      case 'READING': return 18; // Detail Level
      default: return 12;
    }
  };

  // Scanning effect: Slowly drift around Berlin when scanning
  useEffect(() => {
    if (appState === 'SCANNING') {
      const interval = setInterval(() => {
        // Drift slightly to simulate satellite search
        setViewCoords(prev => ({
          lat: BERLIN_CENTER.lat + (Math.random() - 0.5) * 0.05,
          lng: BERLIN_CENTER.lng + (Math.random() - 0.5) * 0.05
        }));
      }, 3000); // Move every 3 seconds
      return () => clearInterval(interval);
    } else if (appState === 'MANIFESTO') {
      setViewCoords(BERLIN_CENTER);
    }
  }, [appState]);

  // When narrative is found, update coords
  useEffect(() => {
    if (currentNarrative) {
      setViewCoords({
        lat: currentNarrative.location.latitude,
        lng: currentNarrative.location.longitude
      });
    }
  }, [currentNarrative]);

  const handleThemeSelect = async (themeContext: string) => {
    setAppState('SCANNING');
    setLoading(true);
    setError(null);
    // Close manifesto when starting a search to clear view
    setIsManifestoOpen(false);

    try {
      const narrative = await generateDocumentaryNarrative(themeContext, language);
      setCurrentNarrative(narrative);
      setAppState('LOCATED');
    } catch (err) {
      setError("Failed to penetrate the historical layer. Try again.");
      setAppState('MANIFESTO');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrequency.trim()) {
      handleThemeSelect(customFrequency);
    }
  };

  const reset = () => {
    setAppState('MANIFESTO');
    setCurrentNarrative(null);
    setCustomFrequency('');
  };

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden ${isRTL ? 'font-sans' : 'font-mono'}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      
      {/* CRT OVERLAY (Scanlines + Vignette) */}
      <div className="crt-overlay">
        <div className="scanlines"></div>
        <div className="vignette"></div>
      </div>

      {/* LAYER 0: OBJECTIVE REALITY (The Map) */}
      {/* Force LTR for map container to prevent coordinate/tile misalignments */}
      <div dir="ltr" className="absolute inset-0">
        <SatelliteView 
            lat={viewCoords.lat}
            lng={viewCoords.lng}
            zoom={getZoomLevel()}
            opacity={appState === 'READING' ? 0.8 : 0.4} 
        />
      </div>

      {/* Persistent UI: Coordinates (Always LTR) */}
      <div dir="ltr">
        <CoordinatesDisplay 
            lat={viewCoords.lat} 
            lng={viewCoords.lng} 
        />
      </div>

      {/* LAYER 1: THE INTERFACE (The Palimpsest) */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* Header */}
        <header className="p-6 flex justify-between items-start pointer-events-auto z-20">
          <div className={`bg-black text-white px-4 py-2 border-2 border-berlin-neon inline-block shadow-[4px_4px_0px_#ff00ff] ${isRTL ? 'shadow-[-4px_4px_0px_#ff00ff]' : ''}`}>
            <h1 className="text-xl font-bold tracking-tighter uppercase">
              <GlitchTitle text={t.title} />
            </h1>
            <div className={`text-[10px] text-berlin-neon uppercase ${isRTL ? 'font-mono' : ''} tracking-wider`}>DAAD Artists-in-Berlin Program</div>
          </div>
          
          <div className="flex gap-2">
            {/* Language buttons moved to footer */}

            {appState !== 'MANIFESTO' && (
              <button onClick={reset} className="bg-white border-4 border-black p-2 hover:bg-red-500 hover:text-white transition-colors pointer-events-auto shadow-[4px_4px_0px_#000]">
                <X size={24} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        {/* Changed layout classes to prevent cutting off top/bottom on smaller screens */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pointer-events-auto w-full z-10">
          <div className="min-h-full flex flex-col items-center justify-center py-8">
          
          {/* STATE: MANIFESTO (Intro) */}
          {appState === 'MANIFESTO' && (
            <div className="w-full max-w-4xl relative animate-in fade-in zoom-in duration-500 flex flex-col gap-6">
              
              <ManifestoCard>
                <div className="space-y-4 text-black">
                  <p className="text-sm font-bold bg-berlin-neon text-white inline-block px-2">{t.mission}</p>
                  <h2 className="text-2xl md:text-4xl font-black uppercase leading-[1.2] tracking-tighter">
                   {t.missionTitle}
                  </h2>
                  <div className={`text-lg leading-relaxed border-berlin-neon pl-4 ${isRTL ? 'border-r-4 pr-4 pl-0' : 'border-l-4'}`}>
                    <TypewriterText text={t.missionText} speed={25} />
                  </div>
                </div>
              </ManifestoCard>

              {/* Grid of Preset Themes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THEMES.map(theme => (
                  <BrutalistButton 
                    key={theme.id} 
                    onClick={() => handleThemeSelect(theme.promptContext)}
                    className={isRTL ? 'font-sans' : 'font-mono'}
                  >
                    {theme.label[language]}
                  </BrutalistButton>
                ))}
              </div>

              {/* Custom Frequency Input */}
              <div className="bg-black p-1 shadow-[4px_4px_0px_#fff] mb-4">
                 <form onSubmit={handleCustomSubmit} className="flex border-2 border-white">
                    <div className="bg-berlin-neon text-white px-3 py-2 flex items-center">
                       <Terminal size={18} />
                    </div>
                    <input 
                      type="text"
                      value={customFrequency}
                      onChange={(e) => setCustomFrequency(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className={`flex-1 bg-black text-white px-4 py-2 outline-none uppercase placeholder-gray-600 screen-glow ${isRTL ? 'text-right font-sans' : 'text-left font-mono'}`}
                    />
                    <button 
                      type="submit"
                      disabled={!customFrequency.trim()}
                      className="bg-white text-black px-4 py-2 hover:bg-berlin-neon hover:text-white transition-colors disabled:opacity-50"
                    >
                      <ArrowRight size={20} />
                    </button>
                 </form>
                 <div className="text-[10px] text-berlin-neon uppercase mt-1 px-1 font-mono">{t.manualInput}</div>
              </div>

            </div>
          )}

          {/* STATE: SCANNING (Loading) */}
          {appState === 'SCANNING' && (
            <div className="text-center space-y-4 my-auto">
              <ScanLine size={64} className="text-berlin-neon animate-pulse mx-auto screen-glow" />
              <div className="bg-black text-white text-xl md:text-2xl font-bold px-4 py-2 border-2 border-berlin-neon uppercase screen-glow">
                {t.scanning}
              </div>
              <p className="text-berlin-neon font-bold bg-black inline-block px-2 uppercase screen-glow">
                {t.searching}
              </p>
            </div>
          )}

          {/* STATE: LOCATED (Target Found) - Center of screen */}
          {appState === 'LOCATED' && currentNarrative && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-50">
                <button 
                  onClick={() => setAppState('READING')}
                  className="group relative pointer-events-auto"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-berlin-neon opacity-0 group-hover:opacity-100 animate-ping"></div>
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-berlin-neon bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:bg-berlin-neon/80 group-hover:scale-110 shadow-[0_0_30px_rgba(255,0,255,0.4)]">
                    <MapPin size={40} className="text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)] animate-bounce" />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white border-4 border-black px-4 py-2 whitespace-nowrap shadow-[4px_4px_0px_#000]">
                    <span className="font-bold text-black uppercase text-sm md:text-base screen-glow">{t.target}</span>
                    <div className="text-xs text-gray-600 font-mono" dir="ltr">{currentNarrative.location.placeName}</div>
                  </div>
                </button>
             </div>
          )}

          {/* STATE: READING (Narrative Overlay) */}
          {appState === 'READING' && currentNarrative && (
            <div className="w-full max-w-3xl my-auto">
              <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_#ff00ff] relative animate-in slide-in-from-bottom duration-700">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-berlin-neon/20 w-32 h-12 rotate-2 backdrop-blur-sm border border-white/50"></div>

                <div className="mb-8 border-b-4 border-black pb-4">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-berlin-neon uppercase">
                     <AlertTriangle size={16} />
                     <span>{t.evidence}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-2 break-words screen-glow">
                    {currentNarrative.title}
                  </h2>
                  <div className="font-mono text-sm text-gray-500" dir="ltr">{currentNarrative.location.placeName}</div>
                </div>

                <div className={`prose prose-lg text-black prose-p:leading-relaxed mb-8 max-w-none ${isRTL ? 'font-sans' : 'font-mono'}`}>
                  <p className="whitespace-pre-wrap">
                    <TypewriterText text={currentNarrative.content} speed={15} />
                  </p>
                </div>

                <div className={`bg-zinc-100 border-berlin-neon p-4 text-sm font-bold text-gray-800 mb-6 ${isRTL ? 'border-r-4' : 'border-l-4'}`}>
                  {t.context}: {currentNarrative.historicalContext}
                </div>

                <div className="flex justify-between items-end border-t-4 border-black pt-4 flex-wrap gap-2">
                  <div className="text-[10px] uppercase text-gray-400">
                    {t.source}: {currentNarrative.sourceRef}
                  </div>
                  <div className={isRTL ? "text-left" : "text-right"}>
                     <div className="text-[10px] uppercase text-gray-400 mb-1">{t.status}</div>
                     <div className="bg-black text-white text-xs px-2 py-1">{t.statusValue}</div>
                  </div>
                </div>
              </div>

            </div>
          )}
          
          </div>
        </main>

        {/* Footer & Credits */}
        <footer className="p-6 pointer-events-auto w-full relative z-20 flex flex-col md:flex-row justify-between items-end gap-4">
           {/* Language Switcher */}
           {appState === 'MANIFESTO' ? (
              <div className="flex bg-white border-4 border-black pointer-events-auto shadow-[4px_4px_0px_#000]">
                  {(['en', 'de', 'fa'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1 font-bold uppercase hover:bg-berlin-neon hover:text-white transition-colors ${language === lang ? 'bg-black text-white' : 'text-black'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
              </div>
           ) : (
             <div></div> 
           )}

            {/* ARTISTIC STATEMENT & CREDITS (TOGGLEABLE) */}
            {appState === 'MANIFESTO' && (
              <div className={`transition-all duration-300 ease-in-out ${isManifestoOpen ? 'w-full md:w-auto' : ''} flex justify-end`}>
                 
                 {/* COLLAPSED STATE */}
                 {!isManifestoOpen && (
                   <button 
                     onClick={() => setIsManifestoOpen(true)}
                     className="bg-black text-berlin-neon border-2 border-berlin-neon px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_#fff] hover:bg-berlin-neon hover:text-white transition-colors flex items-center gap-2"
                   >
                     <span>[ + ]</span> {t.artisticStatementTitle}
                   </button>
                 )}

                 {/* EXPANDED STATE */}
                 {isManifestoOpen && (
                    <div className={`bg-black/95 text-white border-2 border-berlin-neon p-6 max-w-xl w-full backdrop-blur-md shadow-[8px_8px_0px_rgba(255,0,255,0.3)] animate-in slide-in-from-bottom-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                      
                      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                        <div className="text-berlin-neon text-sm font-bold uppercase tracking-widest">{t.artisticStatementTitle}</div>
                        <button 
                          onClick={() => setIsManifestoOpen(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Minus size={20} />
                        </button>
                      </div>

                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-6 whitespace-pre-line text-justify">
                          {t.artisticStatement}
                        </p>
                        
                        {/* CREDITS SECTION (PRESERVED) */}
                        <div className="text-xs border-t border-gray-800 pt-4 space-y-1">
                          <div className="font-bold text-white text-base mb-1">{t.developer}</div>
                          <div className="text-gray-400 mb-3 italic">{t.role}</div>
                          <div className="flex gap-4 text-berlin-neon font-mono text-[10px] uppercase flex-wrap">
                            <a href="https://instagram.com/anabestani_morteza" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded">
                                <ExternalLink size={12} /> @anabestani_morteza
                            </a>
                            <a href="https://instagram.com/codabiat" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded">
                                <ExternalLink size={12} /> @codabiat
                            </a>
                          </div>
                        </div>
                      </div>

                    </div>
                 )}
              </div>
            )}

           {appState === 'READING' && (
              <div className="w-full flex justify-center">
                <button 
                  onClick={() => setAppState('LOCATED')}
                  className="bg-black text-white border-2 border-white px-6 py-2 hover:bg-berlin-neon hover:border-berlin-neon transition-colors font-bold uppercase flex items-center gap-2 shadow-[4px_4px_0px_#fff]"
                >
                  <BookOpen size={18} /> {t.close}
                </button>
              </div>
           )}
        </footer>
      </div>
    </div>
  );
};

export default App;