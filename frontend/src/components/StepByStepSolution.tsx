import { useEffect } from 'react';

interface StepByStepSolutionProps {
  steps: string[];
  formulas: Array<{
    name: string;
    formula: string;
    explanation: string;
  }> | null;
}

export default function StepByStepSolution({ steps, formulas }: StepByStepSolutionProps) {  // Render MathJax when formulas change
  useEffect(() => {
    if (formulas && formulas.length > 0) {
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
  }, [formulas]);
  
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 my-4 text-white">
      <h3 className="text-lg font-bold mb-2 text-blue-400">Solution Steps</h3>
      <ol className="list-decimal list-inside space-y-2 pl-2">
        {steps.map((step, index) => (
          <li key={index} className="text-white">
            {step}
          </li>
        ))}
      </ol>

      {formulas && formulas.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-bold mb-2 text-blue-400">Formulas Used</h4>
          <div className="space-y-2">
            {formulas.map((formula, index) => (              <div key={index} className="bg-gray-700 p-3 rounded">
                <div className="font-medium text-yellow-300">{formula.name}</div>
                <div className="mt-1 latex-content" dangerouslySetInnerHTML={{ __html: `\\(${formula.formula}\\)` }}></div>
                <div className="text-sm text-gray-300 mt-1">{formula.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
