import React, { useState, useEffect, useRef } from 'react';
import { generateDocumentaryNarrative, generateVisualMemory } from './services/geminiService';
import { audioManager } from './services/audioService';
import { SatelliteView } from './components/SatelliteView';
import { BrutalistButton, ManifestoCard, CoordinatesDisplay, GlitchTitle, TypewriterText } from './components/BrutalistUI';
import { NarrativeLayer, AppState, ThemeOption, Language } from './types';
import { MapPin, X, AlertTriangle, ScanLine, BookOpen, ArrowRight, Terminal, ExternalLink, Minus, Clapperboard, Play, Loader2, Eye, Volume2, VolumeX, Camera, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';

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
    role: "Founder of Codabiat (Persian Electronic Literature Group)",
    summon: "Summon Past",
    dreaming: "MATERIALIZING MEMORY...",
    dreamingDesc: "Reconstructing temporal event from archival fragments..."
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
    role: "Gründer von Codabiat (Persische Gruppe für elektronische Literatur)",
    summon: "Vergangenheit Beschwören",
    dreaming: "ERINNERUNG WIRD MATERIALISIERT...",
    dreamingDesc: "Rekonstruktion des zeitlichen Ereignisses aus Archivfragmenten..."
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
    role: "موسس گروه کدابیات (گروه توسعه و آموزش ادبیات الکترونیک فارسی)",
    summon: "احضار گذشته",
    dreaming: "در حال تجسم خاطره...",
    dreamingDesc: "بازسازی رویداد زمانی از قطعات آرشیو..."
  }
};

// Initial View: Berlin Center
const BERLIN_CENTER = { lat: 52.520008, lng: 13.404954 };

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('fa');
  const [appState, setAppState] = useState<AppState>('MANIFESTO');
  const [currentNarrative, setCurrentNarrative] = useState<NarrativeLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFrequency, setCustomFrequency] = useState('');
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [isNarrativeMinimized, setIsNarrativeMinimized] = useState(false);
  const [viewCoords, setViewCoords] = useState(BERLIN_CENTER);
  const [flash, setFlash] = useState(false); 

  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[language];
  const isRTL = language === 'fa';
  
  useEffect(() => {
    const handleInteraction = () => {
        audioManager.init();
        window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  useEffect(() => {
     if (appState === 'SCANNING' || appState === 'DREAMING' || isVisualLoading) {
         audioManager.startDrone();
         if (appState === 'SCANNING' || isVisualLoading) audioManager.playScanNoise();
     } else {
         audioManager.stopDrone();
     }
  }, [appState, isVisualLoading]);

  // Reset minimization when new narrative loads
  useEffect(() => {
    if (appState === 'READING') {
      setIsNarrativeMinimized(false);
    }
  }, [appState]);

  const getZoomLevel = () => {
    switch(appState) {
      case 'MANIFESTO': return 12;
      case 'SCANNING': return 13;
      case 'LOCATED': return 17;
      case 'READING': return 18;
      case 'SUMMONED': return 19; 
      case 'DREAMING': return 19;
      default: return 12;
    }
  };

  useEffect(() => {
    if (appState === 'SCANNING') {
      const interval = setInterval(() => {
        setViewCoords(prev => ({
          lat: BERLIN_CENTER.lat + (Math.random() - 0.5) * 0.05,
          lng: BERLIN_CENTER.lng + (Math.random() - 0.5) * 0.05
        }));
      }, 3000); 
      return () => clearInterval(interval);
    } else if (appState === 'MANIFESTO') {
      setViewCoords(BERLIN_CENTER);
    }
  }, [appState]);

  useEffect(() => {
    if (currentNarrative) {
      setViewCoords({
        lat: currentNarrative.location.latitude,
        lng: currentNarrative.location.longitude
      });
      audioManager.playClick();
    }
  }, [currentNarrative]);

  const handleThemeSelect = async (themeContext: string) => {
    audioManager.playClick();
    setAppState('SCANNING');
    setLoading(true);
    setError(null);
    setVisualUrl(null); 
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

  const handleSummonVisual = async () => {
    audioManager.playClick();
    if (!currentNarrative) return;
    
    setIsVisualLoading(true);
    setError(null);
    setIsNarrativeMinimized(true); // Auto minimize
    
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    try {
      const url = await generateVisualMemory(currentNarrative);
      setVisualUrl(url);
      setAppState('SUMMONED'); 
    } catch (err: any) {
      console.error(err);
      setError("Visual reconstruction failed.");
    } finally {
      setIsVisualLoading(false);
    }
  };

  const reset = () => {
    audioManager.playClick();
    setAppState('MANIFESTO');
    setCurrentNarrative(null);
    setCustomFrequency('');
    setVisualUrl(null);
    setIsNarrativeMinimized(false);
  };

  const toggleMute = () => {
      const muted = audioManager.toggleMute();
      setIsMuted(muted);
  };

  const CORNER_START = isRTL ? 'right-4' : 'left-4';
  const CORNER_END = isRTL ? 'left-4' : 'right-4';
  
  // Dynamic positioning and styling for the narrative box
  const narrativeContainerClass = isNarrativeMinimized
    ? `fixed bottom-12 ${isRTL ? 'right-6' : 'left-6'} w-64 z-30 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom`
    : `relative flex flex-col items-center gap-4 w-full max-w-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-center`;

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden ${isRTL ? 'font-sans' : 'font-mono'}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Camera Flash Overlay */}
      <div 
        className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* --- CORNER 1: BRANDING --- */}
      <div className={`fixed top-4 ${CORNER_START} z-50 pointer-events-none`}>
          <div className={`bg-black text-white px-4 py-2 border-2 border-berlin-neon inline-block shadow-[4px_4px_0px_#ff00ff] ${isRTL ? 'shadow-[-4px_4px_0px_#ff00ff]' : ''} pointer-events-auto`}>
            <h1 className="text-xl font-bold tracking-tighter uppercase">
              <GlitchTitle text={t.title} />
            </h1>
            <div className={`text-[10px] text-berlin-neon uppercase ${isRTL ? 'font-mono' : ''} tracking-wider`}>DAAD Artists-in-Berlin Program</div>
          </div>
      </div>

      {/* --- CORNER 2: SYSTEM CONTROLS --- */}
      <div className={`fixed top-4 ${CORNER_END} z-50 flex flex-col items-end gap-2`}>
         <div className="pointer-events-auto">
             <CoordinatesDisplay lat={viewCoords.lat} lng={viewCoords.lng} />
         </div>
         <div className="flex gap-2 pointer-events-auto" dir="ltr">
             <button 
                onClick={toggleMute}
                className="bg-black text-white border-2 border-white p-2 hover:bg-berlin-neon hover:text-white transition-colors shadow-[2px_2px_0px_#fff]"
                title="Toggle Sound"
             >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
             {appState !== 'MANIFESTO' && (
               <button 
                  onClick={reset} 
                  onMouseEnter={() => audioManager.playHover()}
                  className="bg-white text-black border-2 border-black p-2 hover:bg-red-600 hover:text-white transition-colors shadow-[2px_2px_0px_#000]"
                  title="Reset App"
               >
                 <X size={20} />
               </button>
             )}
         </div>
      </div>

      {/* CRT OVERLAY */}
      <div className="crt-overlay pointer-events-none">
        <div className="scanlines"></div>
        <div className="vignette"></div>
      </div>

      {/* BACKGROUND MAP + OVERLAY IMAGE + LOADING EFFECT */}
      <div dir="ltr" className="absolute inset-0">
        <SatelliteView 
            lat={viewCoords.lat}
            lng={viewCoords.lng}
            zoom={getZoomLevel()}
            opacity={0.8}
            overlayImage={(appState === 'SUMMONED') ? visualUrl : null}
            isLoading={isVisualLoading}
        />
      </div>

      {/* CENTER CONTENT LAYERS */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none p-4 pt-24 pb-24 overflow-y-auto">
          
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-full pointer-events-auto">
          
            {/* STATE: MANIFESTO */}
            {appState === 'MANIFESTO' && (
                <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
                    <ManifestoCard>
                        <div className="space-y-4 text-black">
                        <p className="text-sm font-bold bg-berlin-neon text-white inline-block px-2">{t.mission}</p>
                        <h2 className="text-2xl md:text-4xl font-black uppercase leading-[1.2] tracking-tighter">{t.missionTitle}</h2>
                        <div className={`text-lg leading-relaxed border-berlin-neon pl-4 ${isRTL ? 'border-r-4 pr-4 pl-0' : 'border-l-4'}`}>
                            <TypewriterText text={t.missionText} speed={25} />
                        </div>
                        </div>
                    </ManifestoCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {THEMES.map(theme => (
                        <BrutalistButton 
                            key={theme.id} 
                            onClick={() => handleThemeSelect(theme.promptContext)}
                            onMouseEnter={() => audioManager.playHover()}
                            className={isRTL ? 'font-sans' : 'font-mono'}
                        >
                            {theme.label[language]}
                        </BrutalistButton>
                        ))}
                    </div>

                    <div className="bg-black p-1 shadow-[4px_4px_0px_#fff]">
                        <form onSubmit={handleCustomSubmit} className="flex border-2 border-white">
                            <div className="bg-berlin-neon text-white px-3 py-2 flex items-center"><Terminal size={18} /></div>
                            <input 
                            type="text"
                            value={customFrequency}
                            onChange={(e) => setCustomFrequency(e.target.value)}
                            placeholder={t.inputPlaceholder}
                            className={`flex-1 bg-black text-white px-4 py-2 outline-none uppercase placeholder-gray-600 ${isRTL ? 'text-right font-sans' : 'text-left font-mono'}`}
                            />
                            <button type="submit" disabled={!customFrequency.trim()} className="bg-white text-black px-4 py-2 hover:bg-berlin-neon hover:text-white transition-colors disabled:opacity-50">
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STATE: SCANNING */}
            {appState === 'SCANNING' && (
                <div className="text-center space-y-4">
                    <ScanLine size={64} className="text-berlin-neon animate-pulse mx-auto" />
                    <div className="bg-black text-white text-xl md:text-2xl font-bold px-4 py-2 border-2 border-berlin-neon uppercase">{t.scanning}</div>
                    <p className="text-berlin-neon font-bold bg-black inline-block px-2 uppercase">{t.searching}</p>
                </div>
            )}

            {/* STATE: LOCATED */}
            {appState === 'LOCATED' && currentNarrative && (
                 <button 
                    onClick={() => { audioManager.playClick(); setAppState('READING'); }}
                    onMouseEnter={() => audioManager.playHover()}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-berlin-neon opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-berlin-neon bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:bg-berlin-neon/80 group-hover:scale-110 shadow-[0_0_30px_rgba(255,0,255,0.4)]">
                        <MapPin size={40} className="text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)] animate-bounce" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white border-4 border-black px-4 py-2 whitespace-nowrap shadow-[4px_4px_0px_#000]">
                        <span className="font-bold text-black uppercase text-sm md:text-base">{t.target}</span>
                        <div className="text-xs text-gray-600 font-mono" dir="ltr">{currentNarrative.location.placeName}</div>
                    </div>
                </button>
            )}

            {/* STATE: READING & SUMMONED - Minimizable Card & Actions */}
            {(appState === 'READING' || appState === 'SUMMONED') && currentNarrative && (
                <div className={narrativeContainerClass}>
                    
                    {/* The Narrative Card */}
                    <div className={`bg-white/95 backdrop-blur-sm border-black shadow-[#ff00ff] relative w-full transition-all duration-500 overflow-hidden ${isNarrativeMinimized ? 'border-2 shadow-[4px_4px_0px_#ff00ff] p-3' : 'border-4 shadow-[16px_16px_0px_#ff00ff] p-6 md:p-8'}`}>
                        {/* Header Row */}
                        <div className={`flex items-start justify-between ${isNarrativeMinimized ? 'items-center' : 'border-b-4 border-black pb-4 mb-4'}`}>
                             <div className="flex-1 min-w-0">
                                {!isNarrativeMinimized && (
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-berlin-neon uppercase">
                                        <AlertTriangle size={16} /><span>{t.evidence}</span>
                                    </div>
                                )}
                                <h2 className={`${isNarrativeMinimized ? 'text-sm font-bold truncate' : 'text-xl md:text-3xl font-black uppercase leading-tight break-words pr-4'}`}>{currentNarrative.title}</h2>
                             </div>
                             
                             {/* Minimize/Maximize Button */}
                             <button 
                                onClick={() => setIsNarrativeMinimized(!isNarrativeMinimized)}
                                className={`text-black hover:text-berlin-neon transition-colors shrink-0 ${isNarrativeMinimized ? 'ml-2 p-1' : 'bg-black text-white p-2 hover:bg-berlin-neon'}`}
                             >
                                {isNarrativeMinimized ? <Maximize2 size={16} /> : <Minus size={20} />}
                             </button>
                        </div>

                        {/* Collapsible Content */}
                        {!isNarrativeMinimized && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="font-mono text-sm text-gray-500 mb-4" dir="ltr">{currentNarrative.location.placeName}</div>
                                <div className={`prose prose-lg text-black prose-p:leading-relaxed mb-6 max-w-none ${isRTL ? 'font-sans' : 'font-mono'}`}>
                                    <p className="whitespace-pre-wrap text-sm md:text-base"><TypewriterText text={currentNarrative.content} speed={2} /></p>
                                </div>
                                <div className={`bg-zinc-100 border-berlin-neon p-4 text-xs md:text-sm font-bold text-gray-800 ${isRTL ? 'border-r-4' : 'border-l-4'}`}>
                                    {t.context}: {currentNarrative.historicalContext}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS - Only visible when NOT minimized */}
                    {!isNarrativeMinimized && (
                        <div className="flex gap-4 flex-wrap justify-center w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                            
                            {/* Summon Button */}
                            <button 
                            onClick={handleSummonVisual}
                            disabled={isVisualLoading || appState === 'SUMMONED'} 
                            onMouseEnter={() => audioManager.playHover()}
                            className={`bg-berlin-neon text-white border-2 border-white px-6 py-3 hover:bg-white hover:text-berlin-neon hover:border-berlin-neon transition-colors font-bold uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_#fff] ${isVisualLoading || appState === 'SUMMONED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isVisualLoading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />} 
                                {t.summon}
                            </button>

                            {/* Close Button - Now Minimizes */}
                            <button 
                            onClick={() => { audioManager.playClick(); setIsNarrativeMinimized(true); }}
                            onMouseEnter={() => audioManager.playHover()}
                            className="bg-black text-white border-2 border-white px-6 py-3 hover:bg-berlin-neon hover:border-berlin-neon transition-colors font-bold uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_#fff]"
                            >
                            <BookOpen size={18} /> {t.close}
                            </button>
                        </div>
                    )}

                </div>
            )}
            
          </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full p-6 pointer-events-none z-40 flex flex-col md:flex-row justify-between items-end gap-4">
           {/* Corner 3: Language */}
           <div className="pointer-events-auto">
                {appState === 'MANIFESTO' && (
                    <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_#000]">
                        {(['en', 'de', 'fa'] as Language[]).map(lang => (
                            <button
                            key={lang}
                            onClick={() => { audioManager.playClick(); setLanguage(lang); }}
                            className={`px-3 py-1 font-bold uppercase hover:bg-berlin-neon hover:text-white transition-colors ${language === lang ? 'bg-black text-white' : 'text-black'}`}
                            >
                            {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
           </div>

           {/* Corner 4: Manifesto Toggle */}
           <div className="pointer-events-auto">
                {appState === 'MANIFESTO' && (
                    <div className={`transition-all duration-300 ease-in-out ${isManifestoOpen ? 'w-full md:w-auto fixed bottom-6 right-6 z-50' : ''}`}>
                         {!isManifestoOpen ? (
                            <button 
                                onClick={() => { audioManager.playClick(); setIsManifestoOpen(true); }}
                                className="bg-black text-berlin-neon border-2 border-berlin-neon px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_#fff] hover:bg-berlin-neon hover:text-white transition-colors flex items-center gap-2"
                            >
                                <span>[ + ]</span> {t.artisticStatementTitle}
                            </button>
                         ) : (
                            <div className={`bg-black/95 text-white border-2 border-berlin-neon p-6 max-w-xl w-full backdrop-blur-md shadow-[8px_8px_0px_rgba(255,0,255,0.3)] animate-in slide-in-from-bottom-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                                    <div className="text-berlin-neon text-sm font-bold uppercase tracking-widest">{t.artisticStatementTitle}</div>
                                    <button onClick={() => { audioManager.playClick(); setIsManifestoOpen(false); }} className="text-gray-400 hover:text-white"><Minus size={20} /></button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-6 whitespace-pre-line text-justify">{t.artisticStatement}</p>
                                    <div className="text-xs border-t border-gray-800 pt-4 space-y-1">
                                        <div className="font-bold text-white text-base mb-1">{t.developer}</div>
                                        <div className="text-gray-400 mb-3 italic">{t.role}</div>
                                        <div className="flex gap-4 text-berlin-neon font-mono text-[10px] uppercase flex-wrap">
                                            <a href="https://instagram.com/anabestani_morteza" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded"><ExternalLink size={12} /> @anabestani_morteza</a>
                                            <a href="https://instagram.com/codabiat" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded"><ExternalLink size={12} /> @codabiat</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                )}
           </div>
      </footer>

    </div>
  );
};

export default App;