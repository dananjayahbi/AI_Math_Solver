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
      console.log('Rendering LaTeX near selection with center:', selectionCenter);
      console.log('Selection bounds:', selectionBounds);      // Calculate better position based on selection
      let finalPosition;
      
      if (selectionCenter && selectionBounds) {
        // Position next to the selection based on available space
        const screenWidth = window.innerWidth;
        const estimatedAnswerWidth = 250; // Rough estimate of answer width
        
        // Calculate the available space on different sides
        const rightSpace = screenWidth - selectionBounds.maxX;
        const leftSpace = selectionBounds.minX;
        
        // If there's enough space to the right of the selection
        if (rightSpace >= estimatedAnswerWidth + 30) {
          // Position to the right of the equation with some padding
          finalPosition = {
            x: selectionBounds.maxX + 20, // Add padding from the equation
            y: selectionBounds.minY  // Align with the top of the selection
          };
        } 
        // If there's more space on the left than right
        else if (leftSpace > rightSpace && leftSpace >= estimatedAnswerWidth + 30) {
          // Position to the left of the selection with padding
          finalPosition = {
            x: Math.max(10, selectionBounds.minX - estimatedAnswerWidth - 20),
            y: selectionBounds.minY // Align with the top of the selection
          };
        }
        // Default to below the selection
        else {
          // Not enough space on sides, place below the selection
          finalPosition = {
            x: Math.max(10, selectionCenter.x - (estimatedAnswerWidth / 2)), // Center horizontally with the selection
            y: selectionBounds.maxY + 20 // Place below with padding
          };
        }
        
        // Make sure the position is at least 10px from edges
        finalPosition.x = Math.max(10, finalPosition.x);
        finalPosition.y = Math.max(10, finalPosition.y);
        
        // Ensure the answer doesn't go off-screen
        finalPosition.x = Math.min(finalPosition.x, screenWidth - estimatedAnswerWidth - 10);
        
        console.log('Using calculated position for answer:', finalPosition);
      } else {
        // Fallback to a default position if no selection is available
        finalPosition = latexPosition;
        console.log('Falling back to default position:', finalPosition);
      }
      
      // Update the expression list with the new latex expression
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
