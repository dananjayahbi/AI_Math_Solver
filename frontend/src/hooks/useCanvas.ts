import { useRef, useState, useEffect } from 'react';

/**
 * Custom hook for canvas drawing functionality with eraser support
 */
export const useCanvas = (color: string, eraserEnabled = false) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const canvasStateRef = useRef<ImageData | null>(null);
  const isInitializedRef = useRef(false);
    // Set up the canvas with initial configuration
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Only set canvas dimensions on first render
        if (!isInitializedRef.current) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight - canvas.offsetTop;
          
          // Set the drawing canvas to white background for light theme
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          isInitializedRef.current = true;
        }
        
        // Configure canvas for drawing without wiping the canvas
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = eraserEnabled ? 20 : 3;
        
        // We don't set globalCompositeOperation here anymore, only in draw function
        // This prevents the canvas from clearing when toggling eraser mode
        if (!eraserEnabled) {
          ctx.strokeStyle = color;
        }
        
        // Add resize handler to maintain canvas state on window resize
        const handleResize = () => {
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Save the current state
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Resize
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - canvas.offsetTop;
            
            // Restore white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Restore previous drawing
            ctx.putImageData(imgData, 0, 0);
            
            // Restore settings
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = eraserEnabled ? 20 : 3;
            
            if (eraserEnabled) {
              ctx.globalCompositeOperation = 'destination-out';
            } else {
              ctx.globalCompositeOperation = 'source-over';
              ctx.strokeStyle = color;
            }
          }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }
  }, [color, eraserEnabled]);
  
  // Handle drawing operations
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set composite operation here as well to ensure it's applied correctly
        ctx.globalCompositeOperation = eraserEnabled ? 'destination-out' : 'source-over';
        
        // Save current position
        lastPosRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        
        // Save the canvas state before drawing
        canvasStateRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        setIsDrawing(true);
      }
    }
  };
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set composite operation and line width based on mode - this is now set only during actual drawing
    ctx.globalCompositeOperation = eraserEnabled ? 'destination-out' : 'source-over';
    ctx.lineWidth = eraserEnabled ? 20 : 3;
    
    if (!eraserEnabled) {
      ctx.strokeStyle = color;
    }
    
    // Get current mouse position
    const currentPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    
    // Draw a line from the last position to the current position
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    // Update last position
    lastPosRef.current = currentPos;
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  // Reset canvas to blank state
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset to drawing mode
    ctx.globalCompositeOperation = 'source-over';
  };
  return {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    resetCanvas
  };
};
