import { useRef, useState, useEffect } from 'react';

/**
 * Custom hook for canvas drawing functionality
 */
export const useCanvas = (color: string) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Set up the canvas with initial configuration
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        
        // Configure canvas for drawing
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        
        // Set the drawing canvas to white background for light theme
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add resize handler to maintain canvas state on window resize
        const handleResize = () => {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight - canvas.offsetTop;
          
          // Restore white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Restore drawing
          ctx.putImageData(imgData, 0, 0);
          
          // Restore canvas settings
          ctx.lineCap = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = color;
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }
  }, [color]);  // Handle drawing operations
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };    const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  // Reset canvas to blank state
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
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
