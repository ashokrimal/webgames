import { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Undo2, Redo2, Eraser, Download, Type, Square, Circle, Minus } from 'lucide-react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  className?: string;
  onDrawingChange?: (dataUrl: string) => void;
  disabled?: boolean;
}

type Tool = 'pen' | 'pencil' | 'brush' | 'bucket' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFB6C1', '#87CEEB',
  '#FFD700', '#4B0082', '#F0E68C', '#DDA0DD', '#B0E0E6', '#FF69B4', '#CD5C5C', '#4682B4'
];

export const DrawingCanvas = ({ width, height, className = '', onDrawingChange, disabled = false }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<Tool>('pen');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [customColor, setCustomColor] = useState('#000000');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    setHistory(prev => {
      const newHistory = prev.slice(0, Math.min(historyStep + 1, prev.length));
      newHistory.push(imageData);
      if (newHistory.length > 50) newHistory.shift(); // limit history
      return newHistory;
    });
    setHistoryStep(prev => Math.min(prev + 1, 49));
  }, [width, height, historyStep]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    // Only save initial state once
    if (history.length === 0) {
      const imageData = ctx.getImageData(0, 0, width, height);
      setHistory([imageData]);
      setHistoryStep(0);
    }
  }, [width, height, history.length]);

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const step = historyStep - 1;
    ctx.putImageData(history[step], 0, 0);
    setHistoryStep(step);
    onDrawingChange?.(canvas.toDataURL());
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const step = historyStep + 1;
    ctx.putImageData(history[step], 0, 0);
    setHistoryStep(step);
    onDrawingChange?.(canvas.toDataURL());
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    saveToHistory();
    onDrawingChange?.(canvas.toDataURL());
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height)
    };
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const startPos = (startY * width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b && startA === 255) return;

    const pixelsToCheck = [[startX, startY]];

    while (pixelsToCheck.length > 0) {
      const [x, y] = pixelsToCheck.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const pos = (y * width + x) * 4;
      if (pixels[pos] === startR && pixels[pos + 1] === startG && pixels[pos + 2] === startB && pixels[pos + 3] === startA) {
        pixels[pos] = fillRGB.r;
        pixels[pos + 1] = fillRGB.g;
        pixels[pos + 2] = fillRGB.b;
        pixels[pos + 3] = 255;

        pixelsToCheck.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
    onDrawingChange?.(canvas.toDataURL());
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const pos = getMousePos(e);
    if (tool === 'bucket') {
      floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
    } else if (tool === 'text') {
      setTextPos(pos);
      setShowTextInput(true);
    } else {
      setIsDrawing(true);
      setShapeStart(pos);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || tool === 'bucket' || tool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getMousePos(e);

    if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
      // Preview shape: restore from start of this draw, then draw preview
      const imageData = history[historyStep];
      if (imageData) ctx.putImageData(imageData, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      if (tool === 'rectangle') {
        ctx.rect(shapeStart.x, shapeStart.y, pos.x - shapeStart.x, pos.y - shapeStart.y);
      } else if (tool === 'circle') {
        const radius = Math.hypot(pos.x - shapeStart.x, pos.y - shapeStart.y);
        ctx.arc(shapeStart.x, shapeStart.y, radius, 0, 2 * Math.PI);
      } else if (tool === 'line') {
        ctx.moveTo(shapeStart.x, shapeStart.y);
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'pencil' ? 1 : tool === 'brush' ? lineWidth * 2 : lineWidth;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
      onDrawingChange?.(canvasRef.current?.toDataURL() ?? '');
    }
  };

  const submitText = () => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = `${lineWidth * 5}px sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput('');
    setShowTextInput(false);
    saveToHistory();
    onDrawingChange?.(canvas.toDataURL());
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg">
        {/* Tools */}
        <div className="flex gap-1">
          <button className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('pen')} disabled={disabled} title="Pen">✏️</button>
          <button className={`p-2 rounded ${tool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('pencil')} disabled={disabled} title="Pencil">✒️</button>
          <button className={`p-2 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('brush')} disabled={disabled} title="Brush">🖌️</button>
          <button className={`p-2 rounded ${tool === 'bucket' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('bucket')} disabled={disabled} title="Fill">🪣</button>
          <button className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('eraser')} disabled={disabled} title="Eraser"><Eraser className="w-4 h-4" /></button>
          <button className={`p-2 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('text')} disabled={disabled} title="Text"><Type className="w-4 h-4" /></button>
          <button className={`p-2 rounded ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('rectangle')} disabled={disabled} title="Rectangle"><Square className="w-4 h-4" /></button>
          <button className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('circle')} disabled={disabled} title="Circle"><Circle className="w-4 h-4" /></button>
          <button className={`p-2 rounded ${tool === 'line' ? 'bg-blue-500 text-white' : 'bg-white border'}`} onClick={() => setTool('line')} disabled={disabled} title="Line"><Minus className="w-4 h-4" /></button>
        </div>

        {/* Line Width (for pen/brush) */}
        {tool !== 'bucket' && tool !== 'eraser' && (
          <input
            type="range"
            min={1}
            max={20}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20"
            disabled={disabled}
          />
        )}

        {/* Colors */}
        <div className="flex gap-1 flex-wrap items-center">
          {COLORS.map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              disabled={disabled}
            />
          ))}
          <input
            type="color"
            value={customColor}
            onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }}
            className="w-6 h-6 border-2 border-gray-300 rounded cursor-pointer"
            title="Custom color"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <button onClick={undo} disabled={disabled || historyStep <= 0} className="p-2 bg-white border rounded" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={disabled || historyStep >= history.length - 1} className="p-2 bg-white border rounded" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <button onClick={clearCanvas} disabled={disabled} className="p-2 bg-white border rounded" title="Clear">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={downloadImage} disabled={disabled} className="p-2 bg-white border rounded" title="Download">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded bg-white relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ touchAction: 'none' }}
        />
        {/* Text input overlay */}
        {showTextInput && (
          <div
            className="absolute bg-white border border-gray-400 rounded p-1"
            style={{ left: textPos.x, top: textPos.y }}
          >
            <input
              type="text"
              className="px-1 py-0 border-none outline-none text-sm"
              placeholder="Text..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitText(); if (e.key === 'Escape') { setShowTextInput(false); setTextInput(''); } }}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};
