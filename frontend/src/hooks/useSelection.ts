import { useRef, useState, useEffect } from 'react';
import { Point, SelectionBounds } from '../types/math/types';

/**
 * Custom hook for handling selection functionality
 */
export const useSelection = () => {
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionPath, setSelectionPath] = useState<Point[]>([]);
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);
  const [selectionCenter, setSelectionCenter] = useState<Point | null>(null);
  const [selectionActive, setSelectionActive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Initialize the selection canvas
  useEffect(() => {
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas) {
      // Set canvas dimensions
      selectionCanvas.width = window.innerWidth;
      selectionCanvas.height = window.innerHeight - selectionCanvas.offsetTop;
      
      // Handle window resize
      const handleResize = () => {
        selectionCanvas.width = window.innerWidth;
        selectionCanvas.height = window.innerHeight - selectionCanvas.offsetTop;
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Function to calculate if a point is inside a polygon (free-form selection)
  const isPointInPath = (point: Point, path: Point[]): boolean => {
    // Point-in-polygon algorithm (ray casting)
    let inside = false;
    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const xi = path[i].x, yi = path[i].y;
      const xj = path[j].x, yj = path[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  
  // Function to calculate the bounding box and center of a path
  const calculatePathBounds = (path: Point[]) => {
    if (path.length === 0) return null;
    
    let minX = path[0].x;
    let minY = path[0].y;
    let maxX = path[0].x;
    let maxY = path[0].y;
    
    // Find bounding box
    path.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    // Calculate center using weighted average to get a better center point
    // This helps particularly with equations that have a non-rectangular shape
    const totalPoints = path.length;
    let avgX = 0, avgY = 0;
    
    // Weight more heavily points that are not on the extreme edges
    path.forEach(point => {
      // Distance from edges as weight factors
      const distFromEdgeX = Math.min(point.x - minX, maxX - point.x) / (maxX - minX || 1);
      const distFromEdgeY = Math.min(point.y - minY, maxY - point.y) / (maxY - minY || 1);
      const weight = distFromEdgeX * distFromEdgeY;
      
      avgX += point.x * (1 + weight);
      avgY += point.y * (1 + weight);
    });
    
    // Simple center calculation as fallback
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Use weighted center if it's within the bounds, otherwise use simple center
    const weightedCenterX = avgX / (totalPoints * 1.5);
    const weightedCenterY = avgY / (totalPoints * 1.5);
    
    // Make sure the weighted center is within bounds
    const finalCenterX = (weightedCenterX >= minX && weightedCenterX <= maxX) ? 
      weightedCenterX : centerX;
    const finalCenterY = (weightedCenterY >= minY && weightedCenterY <= maxY) ? 
      weightedCenterY : centerY;
    
    return {
      bounds: { minX, minY, maxX, maxY },
      center: { x: finalCenterX, y: finalCenterY }
    };  };
  
  // Selection functions - now with free-form selection  
  const startSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('startSelection in hook called');
    
    // Get coordinates either from offsetX/Y or calculate from clientX/Y
    let x: number, y: number;
    if (e.nativeEvent.offsetX !== undefined) {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    } else {
      const canvas = selectionCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else {
        // Fallback
        x = e.clientX;
        y = e.clientY;
      }
    }
    
    console.log('Selection starting at point:', x, y);
    
    // Initialize a new path with the starting point
    setSelectionPath([{ x, y }]);
    setIsSelecting(true);
    setSelectionActive(false); // Reset active selection while drawing a new one
    
    // Clear previous selection
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        // Make sure the canvas dimensions are set correctly
        selectionCanvas.width = window.innerWidth;
        selectionCanvas.height = window.innerHeight - selectionCanvas.offsetTop;
        
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Start a new path
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        // Draw a clear starting point
        ctx.fillStyle = 'rgba(0, 123, 255, 0.5)';
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        console.log('Selection started and initial point drawn on canvas');
      }
    }
  };
    const updateSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting) {
      console.log('updateSelection called, but not in selecting state');
      return;
    }
    
    console.log('updateSelection in hook called', isSelecting);
    
    // Get coordinates either from offsetX/Y or calculate from clientX/Y
    let x: number, y: number;
    if (e.nativeEvent.offsetX !== undefined) {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    } else {
      const canvas = selectionCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else {
        // Fallback
        x = e.clientX;
        y = e.clientY;
      }
    }
    
    // Add the new point to the path
    const newPoint = { x, y };
    setSelectionPath(prev => [...prev, newPoint]);
    
    // Draw the selection path
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        // Clear the canvas and redraw the entire path
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Draw the entire path with a smoother appearance
        const currentPath = [...selectionPath, newPoint];
        
        if (currentPath.length > 0) {
          ctx.beginPath();
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
          }
        }
        
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Add a subtle fill to show the selected area
        ctx.fillStyle = 'rgba(0, 123, 255, 0.08)';
        ctx.fill();
      }
    }
  };
  
  const endSelection = () => {
    setIsSelecting(false);
    
    // Close the path if needed
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas && selectionPath.length > 2) {
      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        // Clear and redraw the entire path to ensure it's closed correctly
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Draw the complete path with the first point added at the end to close it
        ctx.beginPath();
        ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
        
        // Draw all points
        for (let i = 1; i < selectionPath.length; i++) {
          ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
        }
        
        // Close back to the first point
        ctx.lineTo(selectionPath[0].x, selectionPath[0].y);
        
        // Style the outline
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Fill the selection area
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        ctx.fill();
        
        // Calculate the bounds and center of the selection
        const pathInfo = calculatePathBounds(selectionPath);
        if (pathInfo) {
          setSelectionBounds(pathInfo.bounds);
          setSelectionCenter(pathInfo.center);
          setSelectionActive(true);
          
          // Add a better visual indicator at the center point
          // Outer circle (highlight)
          ctx.beginPath();
          ctx.arc(pathInfo.center.x, pathInfo.center.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
          
          // Inner circle (position marker)
          ctx.beginPath();
          ctx.arc(pathInfo.center.x, pathInfo.center.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 123, 255, 0.8)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Add crosshair lines for better visibility
          ctx.beginPath();
          const crossSize = 12;
          // Horizontal line
          ctx.moveTo(pathInfo.center.x - crossSize, pathInfo.center.y);
          ctx.lineTo(pathInfo.center.x + crossSize, pathInfo.center.y);
          // Vertical line
          ctx.moveTo(pathInfo.center.x, pathInfo.center.y - crossSize);
          ctx.lineTo(pathInfo.center.x, pathInfo.center.y + crossSize);
          ctx.strokeStyle = 'rgba(0, 123, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else {
      // Clear the selection if it's too small
      setSelectionPath([]);
      setSelectionActive(false);
    }
  };
  
  const toggleSelectionMode = () => {
    // Toggle between drawing and selection mode
    setSelectionMode(prev => !prev);
    setSelectionActive(false);
    
    // Clear selection canvas
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
      }
    }
  };

  // Clear selection state
  const clearSelection = () => {
    setSelectionPath([]);
    setSelectionCenter(null);
    setSelectionBounds(null);
    setSelectionActive(false);
    
    const selectionCanvas = selectionCanvasRef.current;
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
      }
    }
  };

  return {
    selectionCanvasRef,
    isSelecting,
    selectionPath,
    selectionBounds,
    selectionCenter,
    selectionActive,
    selectionMode,
    setSelectionMode,
    setSelectionActive,
    setSelectionPath,
    setSelectionCenter,
    setSelectionBounds,
    startSelection,
    updateSelection,
    endSelection,
    toggleSelectionMode,
    clearSelection,
    isPointInPath,
    calculatePathBounds
  };
};
