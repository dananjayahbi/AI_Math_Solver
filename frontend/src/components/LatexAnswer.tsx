import Draggable from 'react-draggable';
import { useState } from 'react';
import StepByStepSolution from './StepByStepSolution';
import { FormulaInfo, LatexExpressionItem } from '../types/math/types';

interface LatexAnswerProps {
  item: LatexExpressionItem;
  index: number;
  steps?: string[];
  formulas?: FormulaInfo[] | null;
  showDetailedSteps: boolean;
  onPositionChange: (index: number, x: number, y: number) => void;
  onDelete: (index: number) => void;
}

/**
 * Component for rendering LaTeX answers with draggable functionality
 */
export default function LatexAnswer({
  item,
  index,
  steps,
  formulas,
  showDetailedSteps,
  onPositionChange,
  onDelete
}: LatexAnswerProps) {
  const [zIndex, setZIndex] = useState(30);

  return (
    <Draggable
      key={index}
      defaultPosition={{
        x: item.position.x + 40, // Position to the right of equation
        y: item.position.y - 30  // Position above equation
      }}
      bounds="parent"
      handle=".drag-handle"
      onStart={() => {
        // Add high z-index during dragging
        const element = document.getElementById(`latex-container-${index}`);
        if (element) {
          element.classList.add('dragging');
          setZIndex(1000);
        }
      }}
      onStop={(_, data) => {
        const element = document.getElementById(`latex-container-${index}`);
        if (element) {
          element.classList.remove('dragging');
          setZIndex(30);
        }
        
        // Update position with correct offsets
        onPositionChange(index, data.x - 40, data.y + 30);
      }}
    >
      <div 
        id={`latex-container-${index}`}
        className="pointer-events-auto animate-fade-in relative"
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
          cursor: 'move',
          transition: 'all 0.2s ease',
          transform: 'scale(1)',
          pointerEvents: 'auto'
        }}
      >
        <div 
          className="drag-handle absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-move"
          style={{ 
            touchAction: 'none',
            cursor: 'move',
            background: 'rgba(59, 130, 246, 0.1)',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            borderBottom: '1px dashed rgba(59, 130, 246, 0.3)'
          }}
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
            formulas={formulas} 
          />
        )}
      </div>
    </Draggable>
  );
}
