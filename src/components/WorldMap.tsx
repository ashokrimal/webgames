import { useRef, useEffect, useState, useCallback } from 'react';

interface WorldMapProps {
  width: number;
  height: number;
  onGuess: (lat: number, lng: number) => void;
  disabled?: boolean;
  revealMode?: boolean;
  correctLocation?: { lat: number; lng: number; name: string };
  guesses?: Array<{ lat: number; lng: number; username: string; distanceKm: number }>;
}

export const WorldMap = ({ width, height, onGuess, disabled = false, revealMode = false, correctLocation, guesses = [] }: WorldMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const redrawBase = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mapImageRef.current, 0, 0, width, height);
  }, [width, height]);

  const latLngToPixel = useCallback((lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      mapImageRef.current = img;
      redrawBase();
      setMapLoaded(true);
    };
    // Simple world map from Wikimedia Commons (public domain)
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/BlankMap-World-v6.svg/1280px-BlankMap-World-v6.svg.png';
  }, [width, height, redrawBase]);

  // Render reveal overlay
  useEffect(() => {
    if (!revealMode || !mapLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawBase();

    if (correctLocation) {
      const correct = latLngToPixel(correctLocation.lat, correctLocation.lng);
      // Correct location marker (green)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(correct.x, correct.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Label
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.fillText(correctLocation.name, correct.x + 12, correct.y - 8);
    }

    guesses.forEach((g) => {
      const guess = latLngToPixel(g.lat, g.lng);
      // Guess marker (red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(guess.x, guess.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Username label
      ctx.fillStyle = '#000000';
      ctx.font = '11px sans-serif';
      ctx.fillText(g.username, guess.x + 10, guess.y - 6);

      // Line from guess to correct
      if (correctLocation) {
        const correct = latLngToPixel(correctLocation.lat, correctLocation.lng);
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(guess.x, guess.y);
        ctx.lineTo(correct.x, correct.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Distance label at midpoint
        const mx = (guess.x + correct.x) / 2;
        const my = (guess.y + correct.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 30, my - 8, 60, 16);
        ctx.fillStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(g.distanceKm)} km`, mx, my + 3);
        ctx.textAlign = 'start';
      }
    });
  }, [revealMode, mapLoaded, correctLocation, guesses, width, height, redrawBase, latLngToPixel]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || !mapLoaded || revealMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const y = (e.clientY - rect.top) * (height / rect.height);

    // Convert pixel coordinates to lat/lng (approximate)
    const lng = (x / width) * 360 - 180;
    const lat = 90 - (y / height) * 180;

    // Redraw base map then draw marker
    const ctx = canvas.getContext('2d');
    if (ctx) {
      redrawBase();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    onGuess(lat, lng);
  };

  return (
    <div className="border-2 border-gray-300 rounded bg-white relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full ${disabled || revealMode ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        onClick={handleClick}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
    </div>
  );
};
