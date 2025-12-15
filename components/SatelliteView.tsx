import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Radio } from 'lucide-react';
import { GhostPersona } from '../types';
import { TypewriterText } from './BrutalistUI';

interface SatelliteViewProps {
  lat: number;
  lng: number;
  zoom: number;
  opacity: number;
  overlayImage?: string | null;
  isLoading?: boolean;
}

// SHARED CONSTANT FOR IMAGE SIZE TO ENSURE ALIGNMENT
const IMAGE_SIZE_CLASS = "w-[75%] h-[75%] md:w-[70%] md:h-[70%]";

export const SatelliteView: React.FC<SatelliteViewProps> = ({ 
  lat, 
  lng, 
  zoom, 
  opacity, 
  overlayImage, 
  isLoading,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false, 
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle View Updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapInstanceRef.current.flyTo([lat, lng], zoom, {
      animate: true,
      duration: 3.5,
      easeLinearity: 0.1
    });
  }, [lat, lng, zoom]);

  // Digital Noise Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const noiseCount = isLoading ? 5000 : 2000;
      
      for (let i = 0; i < noiseCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const op = Math.random() * (isLoading ? 0.4 : 0.2);
        ctx.fillStyle = isLoading ? `rgba(0, 255, 255, ${op})` : `rgba(255, 0, 255, ${op})`; 
        ctx.fillRect(x, y, 2, 2);
      }
      
      ctx.strokeStyle = isLoading ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      for(let x = 0; x < w; x+= 120) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
       for(let y = 0; y < h; y+= 120) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    render();
    window.addEventListener('resize', render);
    const interval = setInterval(render, 100);

    return () => {
      window.removeEventListener('resize', render);
      clearInterval(interval);
    };
  }, [isLoading]);

  return (
    <div 
      className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black transition-opacity duration-1000 ease-in-out pointer-events-none"
      style={{ opacity }}
    >
        {/* LAYER 0: Leaflet Map Container (Background) */}
        <div 
            ref={mapContainerRef}
            className="absolute inset-0 z-0 pointer-events-none" 
            style={{ 
                filter: isLoading 
                  ? 'grayscale(100%) contrast(150%) brightness(40%) blur(2px)'
                  : 'grayscale(100%) contrast(140%) brightness(50%) sepia(20%)',
                transition: 'filter 0.5s ease-in-out'
            }}
        />

        {/* LOADING EFFECT */}
        {isLoading && (
            <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-2 bg-berlin-neon shadow-[0_0_20px_#ff00ff] animate-[scan_2s_linear_infinite] opacity-50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-berlin-neon font-mono text-sm tracking-widest animate-pulse bg-black px-4 py-2 border border-berlin-neon">
                   RECONSTRUCTING TEMPORAL LAYER...
                </div>
            </div>
        )}

        {/* LAYER 1: IMAGE (Z-10) - Sits BELOW the noise */}
        {overlayImage && !isLoading && (
            <div 
                className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-[1500ms]"
                style={{ mixBlendMode: 'normal' }}
            >
                <div className={`relative ${IMAGE_SIZE_CLASS} border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-none`}> 
                    <img 
                        src={overlayImage} 
                        alt="Historical Layer"
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                            filter: 'sepia(30%) contrast(110%) brightness(90%)'
                        }}
                    />
                </div>
            </div>
        )}
        
        {/* LAYER 2: NOISE CANVAS (Z-20) */}
        <canvas ref={canvasRef} className="absolute inset-0 z-20 mix-blend-overlay pointer-events-none" />
        
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 h-full w-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"></div>
        
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
    </div>
  );
};

// NEW SEPARATE COMPONENT FOR THE INTERACTIVE DOT
// This sits on top of everything in App.tsx to ensure it catches clicks
export const GhostLayer: React.FC<{ ghostPersona: GhostPersona | null }> = ({ ghostPersona }) => {
    const [isGhostOpen, setIsGhostOpen] = useState(false);

    if (!ghostPersona) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
             {/* EXACT SAME SIZING AS THE IMAGE CONTAINER */}
             <div className={`relative ${IMAGE_SIZE_CLASS}`}>
                <div 
                    className="absolute pointer-events-auto"
                    style={{ 
                        top: `${ghostPersona.y}%`, 
                        left: `${ghostPersona.x}%`,
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsGhostOpen(!isGhostOpen);
                            }}
                            className="group relative w-16 h-16 flex items-center justify-center focus:outline-none cursor-pointer"
                            aria-label="Interact with signal"
                        >
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white shadow-[0_0_15px_red] group-hover:scale-150 transition-transform"></span>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black text-white px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white pointer-events-none font-mono">
                                HUMAN SIGNAL DETECTED
                            </div>
                        </button>

                        {isGhostOpen && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-56 md:w-72 bg-black/95 text-white border-2 border-white p-4 shadow-[8px_8px_0px_#ff00ff] backdrop-blur-md animate-in zoom-in duration-200 z-[70] text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2 border-b border-gray-600 pb-2 mb-3 text-berlin-neon text-sm font-bold uppercase tracking-wider">
                                    <Radio size={14} className="animate-pulse" />
                                    <span>{ghostPersona.role}</span>
                                </div>
                                <div className="font-mono text-sm italic leading-relaxed text-gray-200">
                                    "<TypewriterText text={ghostPersona.monologue} speed={30} />"
                                </div>
                                {/* Close Hint */}
                                <button onClick={() => setIsGhostOpen(false)} className="mt-3 text-[10px] text-gray-500 uppercase hover:text-white">[ close transmission ]</button>
                            </div>
                        )}
                </div>
             </div>
        </div>
    );
};