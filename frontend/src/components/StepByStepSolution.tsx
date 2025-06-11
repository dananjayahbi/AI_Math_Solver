import { useEffect, useState } from 'react';

interface StepByStepSolutionProps {
  steps: string[];
  formulas: Array<{
    name: string;
    formula: string;
    explanation: string;
  }> | null;
}

export default function StepByStepSolution({ steps, formulas }: StepByStepSolutionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 my-4 text-gray-900">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-bold text-blue-600">Solution Steps</h3>
        <div className="text-blue-600 transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
          {/* Chevron down/up icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      <div 
        className="overflow-hidden transition-all duration-300"
        style={{ 
          maxHeight: isCollapsed ? '0' : '1000px',
          opacity: isCollapsed ? 0 : 1,
          marginTop: isCollapsed ? '0' : '1rem'
        }}
      >
        <ol className="list-decimal list-inside space-y-2 pl-2 text-gray-700">
          {steps.map((step, index) => (
            <li key={index}>
              {step}
            </li>
          ))}
        </ol>

        {formulas && formulas.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-bold mb-2 text-blue-600">Formulas Used</h4>
            <div className="space-y-2">
              {formulas.map((formula, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 p-3 rounded">
                  <div className="font-medium text-blue-700">{formula.name}</div>
                  <div className="mt-1 latex-content" dangerouslySetInnerHTML={{ __html: `\\(${formula.formula}\\)` }}></div>
                  <div className="text-sm text-gray-600 mt-1">{formula.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
