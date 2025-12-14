import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface SatelliteViewProps {
  lat: number;
  lng: number;
  zoom: number;
  opacity: number;
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({ lat, lng, zoom, opacity }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Leaflet Map
    // We disable all interactions to keep the "closed/limited" feel requested.
    // The map is a cinematic background, not a tool for navigation.
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

    // Dark Satellite Layer (Esri World Imagery)
    // We use Esri for high-quality satellite data.
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

  // Handle View Updates (Cinematic Movement)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Smoothly fly to new coordinates
    mapInstanceRef.current.flyTo([lat, lng], zoom, {
      animate: true,
      duration: 3.5, // Slow, heavy, cinematic movement
      easeLinearity: 0.1
    });
  }, [lat, lng, zoom]);

  // Digital Noise Overlay (The "Palimpsest" Grain)
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
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const op = Math.random() * 0.2;
        ctx.fillStyle = `rgba(255, 0, 255, ${op})`; // Magenta static
        ctx.fillRect(x, y, 2, 2);
      }
      
      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Vertical
      for(let x = 0; x < w; x+= 120) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
       // Horizontal
       for(let y = 0; y < h; y+= 120) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    render();
    window.addEventListener('resize', render);
    // Animate noise
    const interval = setInterval(render, 100);

    return () => {
      window.removeEventListener('resize', render);
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black transition-opacity duration-1000 ease-in-out pointer-events-none"
      style={{ opacity }}
    >
        {/* Leaflet Map Container with Brutalist Filters */}
        <div 
            ref={mapContainerRef}
            className="absolute inset-0 z-0"
            style={{ 
                // Extreme contrast and grayscale to look like surveillance footage
                filter: 'grayscale(100%) contrast(140%) brightness(50%) sepia(20%)'
            }}
        />
        
        {/* Canvas for Digital Noise Overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 mix-blend-overlay" />
        
        {/* Crosshair Center */}
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20"></div>
        <div className="absolute top-1/2 left-1/2 h-full w-[1px] bg-berlin-neon opacity-30 -translate-x-1/2 -translate-y-1/2 z-20"></div>
    </div>
  );
};