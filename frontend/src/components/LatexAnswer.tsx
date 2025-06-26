import { useState, useRef, useEffect } from 'react';
import StepByStepSolution from './StepByStepSolution';
import { LatexExpressionItem } from '../types/math/types';

interface LatexAnswerProps {
  item: LatexExpressionItem;
  index: number;
  steps?: string[];
  formulas?: Array<{
    name: string;
    formula: string;
    explanation: string;
  }> | null;
  showDetailedSteps: boolean;
  onPositionChange: (index: number, x: number, y: number) => void;
  onDelete: (index: number) => void;
}

/**
 * Component for rendering LaTeX answers with draggable functionality
 * Using native browser drag and drop for better compatibility
 */
export default function LatexAnswer({
  item,  index,
  steps,
  formulas,
  showDetailedSteps,
  onPositionChange,
  onDelete
}: LatexAnswerProps) {    const [zIndex, setZIndex] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  // Use local state to track position during drag for smooth visual updates
  const [localPosition, setLocalPosition] = useState({ x: item.position.x, y: item.position.y });
  
  // Sync local position with item position when item.position changes
  useEffect(() => {
    setLocalPosition({ x: item.position.x, y: item.position.y });
  }, [item.position.x, item.position.y]);
  
  // Debug log to check mounting
  useEffect(() => {
    console.log(`LatexAnswer ${index} mounted at position:`, item.position);
    return () => console.log(`LatexAnswer ${index} unmounted`);
  }, [index, item.position]);
  
  // Implement manual drag handling using pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!nodeRef.current) return;
    
    // Capture the pointer to receive events even when pointer moves outside target
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    // Get initial pointer and element positions
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = localPosition.x;
    const startTop = localPosition.y;
    
    // Set dragging state
    setIsDragging(true);
    setZIndex(1000);
    console.log('Drag started for answer', index);
    
    // Add dragging class to body
    document.body.classList.add('dragging-active');
    
    // Handle pointer move
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (nodeRef.current) {
        // Calculate the distance moved
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        // Calculate new position
        const newX = startLeft + dx;
        const newY = startTop + dy;
        
        // Update local position for immediate visual feedback
        setLocalPosition({ x: newX, y: newY });
      }
    };    // Handle pointer up
    const handlePointerUp = () => {
      // Release pointer capture
      if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
      
      setIsDragging(false);
      setZIndex(30);
      
      console.log('Drag stopped for answer', index, 'at position', localPosition.x, localPosition.y);
      
      // Now update the parent component's state with our final position
      onPositionChange(index, localPosition.x, localPosition.y);
      
      // Remove dragging class from body
      document.body.classList.remove('dragging-active');
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    // Add event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };    return (<div 
        ref={nodeRef}
        id={`latex-container-${index}`}
        className={`pointer-events-auto animate-fade-in relative latex-answer-container ${isDragging ? 'dragging' : ''}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          boxShadow: isDragging 
            ? '0 12px 28px rgba(0, 0, 0, 0.25), 0 8px 10px rgba(0, 0, 0, 0.12)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(59, 130, 246, 0.08)',
          padding: '14px 16px 12px 16px',
          minWidth: '120px',
          maxWidth: '400px',
          width: 'fit-content',
          zIndex,
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'absolute',
          left: `${localPosition.x}px`,
          top: `${localPosition.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          pointerEvents: 'auto',
          touchAction: 'none',
          userSelect: 'none',
          backdropFilter: 'blur(4px)'
        }}><div 
          className={`drag-handle absolute top-0 left-0 right-0 h-6 flex items-center justify-center ${isDragging ? 'dragging-handle' : ''}`}
          style={{ 
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: isDragging 
              ? 'linear-gradient(to right, rgba(99, 170, 255, 0.7), rgba(56, 138, 255, 0.7))' 
              : 'linear-gradient(to right, rgba(99, 170, 255, 0.3), rgba(56, 138, 255, 0.3))',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            textAlign: 'center',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.9)',
            zIndex: 2000,
            width: '100%',
            userSelect: 'none',
            pointerEvents: 'auto',
            boxShadow: isDragging ? 'inset 0 -2px 3px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'background 0.2s ease'
          }}
          onPointerDown={handlePointerDown}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 24 12" fill="white" opacity="0.8" stroke="none">
              <rect x="2" y="1" width="20" height="2" rx="1" />
              <rect x="2" y="5" width="20" height="2" rx="1" />
              <rect x="2" y="9" width="20" height="2" rx="1" />
            </svg>
          </div>
        </div>        <button 
          className="absolute -top-2 -right-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full text-xs cursor-pointer z-30 shadow-md border border-gray-200 transition-colors duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          aria-label="Delete answer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>        <div 
          className="latex-content math-output mt-6" 
          style={{
            padding: '8px 4px',
            fontSize: '1.25rem',
            lineHeight: '1.5',
            textAlign: 'center',
            color: '#1a202c',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          dangerouslySetInnerHTML={{ __html: item.latex }}>
        </div>
          {steps && steps.length > 0 && showDetailedSteps && (
          <StepByStepSolution 
            steps={steps} 
            formulas={formulas || null} 
          />        )}      </div>
  );
}
