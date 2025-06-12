import { useState, useCallback, useEffect } from 'react';
import { LatexExpressionItem, MathResult, Point, SelectionBounds } from '../types/math/types';

/**
 * Custom hook for LaTeX rendering functionality
 */
export const useLatexRenderer = () => {
  const [latexPosition, setLatexPosition] = useState<Point>({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<LatexExpressionItem>>([]);
  
  // Function to render LaTeX to canvas
  const renderLatexToCanvas = useCallback(
    (
      expression: string, 
      answer: MathResult, 
      selectionCenter: Point | null, 
      selectionBounds: SelectionBounds | null
    ) => {
      // Format the LaTeX with proper sizing and escaping
      const escapedExpr = expression.replace(/\\/g, '\\\\');
      // Ensure answer is a string before calling replace
      const answerStr = String(answer);
      const escapedAnswer = answerStr.replace(/\\/g, '\\\\');
      // Use proper LaTeX formatting - with correct escaping for MathJax
      const latex = `\\(${escapedExpr} = ${escapedAnswer}\\)`;
      
      // Log position for debugging
      console.log('Selection center:', selectionCenter);
      console.log('LatexPosition:', latexPosition);
      
      // Calculate better position based on selection
      // If selection is available, position to the immediate right of the equation
      let finalPosition;
      
      if (selectionCenter && selectionBounds) {
        // Position to the right of the equation at the vertical center
        finalPosition = {
          // Instead of the center, use the right edge of the selection
          x: selectionBounds.maxX + 20, // Add some padding from the equation
          y: selectionCenter.y // Vertically align with the center
        };
        
        console.log('Using calculated position:', finalPosition);
      } else {
        finalPosition = latexPosition;
        console.log('Falling back to default position:', finalPosition);
      }
      
      // Use the current center point of the selection for positioning
      setLatexExpression(prevExpressions => [
        ...prevExpressions, 
        {
          latex: latex,
          position: finalPosition
        }
      ]);
      
      return finalPosition;
    },
    [latexPosition]
  );

  // Configure MathJax when expressions change
  useEffect(() => {
    if (latexExpression.length > 0) {
      // For MathJax 3.x - wait for it to be loaded
      if (window.MathJax && window.MathJax.typesetPromise) {
        // If MathJax is already loaded, typeset immediately
        setTimeout(() => {
          window.MathJax.typesetPromise?.()
            .catch((err) => console.error('MathJax typesetting failed:', err));
        }, 100);
      } else {
        // If MathJax is not loaded yet, set up a check every 100ms
        const checkInterval = setInterval(() => {
          if (window.MathJax && window.MathJax.typesetPromise) {
            clearInterval(checkInterval);
            window.MathJax.typesetPromise?.()
              .catch((err) => console.error('MathJax typesetting failed:', err));
          }
        }, 100);
        
        // Clear interval after 5 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 5000);
        
        return () => clearInterval(checkInterval);
      }
    }
  }, [latexExpression]);

  // MathJax configuration
  useEffect(() => {
    // MathJax is already configured in index.html
    // Additional runtime configuration to ensure UI elements are disabled
    if (window.MathJax) {
      // Force disable only MathJax UI control elements after rendering
      setTimeout(() => {
        // Target only UI controls but preserve the actual math content
        document.querySelectorAll('mjx-container svg').forEach(svg => {
          // Find elements with data-name="annotations" (the scrolling control)
          const uiControls = svg.querySelectorAll('g[data-name="annotations"]');
          uiControls.forEach(control => {
            if (control.parentNode) {
              control.parentNode.removeChild(control);
            }
          });
        });
      }, 500);
    }
  }, []);

  return {
    latexPosition,
    latexExpression,
    setLatexPosition,
    setLatexExpression,
    renderLatexToCanvas
  };
};
