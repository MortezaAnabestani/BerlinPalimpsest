import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ScanLine } from 'lucide-react';

interface SatelliteViewProps {
  lat: number;
  lng: number;
  zoom: number;
  opacity: number;
  overlayImage?: string | null;
  isLoading?: boolean; // New prop for subtle loading effect
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({ lat, lng, zoom, opacity, overlayImage, isLoading }) => {
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

      // Generate static noise
      // Increase intensity if loading
      const noiseCount = isLoading ? 5000 : 2000;
      
      for (let i = 0; i < noiseCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const op = Math.random() * (isLoading ? 0.4 : 0.2);
        ctx.fillStyle = isLoading ? `rgba(0, 255, 255, ${op})` : `rgba(255, 0, 255, ${op})`; 
        ctx.fillRect(x, y, 2, 2);
      }
      
      // Grid lines
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
        {/* Leaflet Map Container */}
        <div 
            ref={mapContainerRef}
            className="absolute inset-0 z-0"
            style={{ 
                filter: isLoading 
                  ? 'grayscale(100%) contrast(150%) brightness(40%) blur(2px)' // Blur map slightly when loading
                  : 'grayscale(100%) contrast(140%) brightness(50%) sepia(20%)',
                transition: 'filter 0.5s ease-in-out'
            }}
        />

        {/* LOADING EFFECT OVERLAY (Scanning Bar) */}
        {isLoading && (
            <div className="absolute inset-0 z-20 overflow-hidden">
                {/* Scanning Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-berlin-neon shadow-[0_0_20px_#ff00ff] animate-[scan_2s_linear_infinite] opacity-50"></div>
                
                {/* Tech Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-berlin-neon font-mono text-sm tracking-widest animate-pulse bg-black px-4 py-2 border border-berlin-neon">
                   RECONSTRUCTING TEMPORAL LAYER...
                </div>
            </div>
        )}

        {/* HISTORICAL OVERLAY */}
        {overlayImage && !isLoading && (
            <div 
                className="absolute inset-0 z-5 flex items-center justify-center animate-in fade-in duration-[2000ms]"
                style={{ mixBlendMode: 'normal' }}
            >
                <img 
                    src={overlayImage} 
                    alt="Historical Layer"
                    className="w-full h-full object-cover scale-110"
                    style={{
                        maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                        filter: 'sepia(30%) contrast(110%) brightness(90%)'
                    }}
                />
            </div>
        )}
        
        {/* Canvas Noise */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 mix-blend-overlay" />
        
        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20"></div>
        <div className="absolute top-1/2 left-1/2 h-full w-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20"></div>
        
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