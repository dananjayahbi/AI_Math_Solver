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
}: LatexAnswerProps) {  
  const [zIndex, setZIndex] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  
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
    const startLeft = item.position.x;
    const startTop = item.position.y;
    
    // Set dragging state
    setIsDragging(true);
    setZIndex(1000);
    console.log('Drag started for answer', index);
    
    // Add dragging class to body
    document.body.classList.add('dragging-active');
    
    // Handle pointer move
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isDragging && nodeRef.current) {
        // Calculate the distance moved
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        // Calculate new position
        const newX = startLeft + dx;
        const newY = startTop + dy;
        
        // Update the element's position in state
        onPositionChange(index, newX, newY);
      }
    };
    
    // Handle pointer up
    const handlePointerUp = (upEvent: PointerEvent) => {
      // Release pointer capture
      if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
      
      setIsDragging(false);
      setZIndex(30);
      
      // Calculate final position
      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      const finalX = startLeft + dx;
      const finalY = startTop + dy;
      
      console.log('Drag stopped for answer', index, 'at position', finalX, finalY);
      
      // Ensure position is updated
      onPositionChange(index, finalX, finalY);
      
      // Remove dragging class from body
      document.body.classList.remove('dragging-active');
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    // Add event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };
  
  return (<div 
        ref={nodeRef}
        id={`latex-container-${index}`}
        className={`pointer-events-auto animate-fade-in relative latex-answer-container ${isDragging ? 'dragging' : ''}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          padding: '16px 16px 12px 16px',
          minWidth: '120px',
          maxWidth: '400px',
          width: 'fit-content',
          zIndex,
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'absolute',
          left: `${item.position.x}px`,
          top: `${item.position.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          pointerEvents: 'auto',
          touchAction: 'none',
          userSelect: 'none'
        }}>
        <div 
          className={`drag-handle absolute top-0 left-0 right-0 h-8 flex items-center justify-center ${isDragging ? 'dragging-handle' : ''}`}
          style={{ 
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            borderBottom: '1px dashed rgba(59, 130, 246, 0.5)',
            textAlign: 'center',
            fontSize: '10px',
            color: 'rgba(59, 130, 246, 0.8)',
            zIndex: 2000,
            width: '100%',
            userSelect: 'none',
            pointerEvents: 'auto'
          }}
          onPointerDown={handlePointerDown}
        >
          <div className="flex space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="rgba(59, 130, 246, 0.7)" stroke="none">
              <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
        </div>
        <button 
          className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full text-sm cursor-pointer z-30 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
        >
          ×
        </button>
        <div 
          className="latex-content math-output mt-6" 
          style={{
            padding: '4px',
            fontSize: '1.2rem',
            lineHeight: '1.5',
            textAlign: 'center'
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
