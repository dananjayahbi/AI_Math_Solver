import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Formula {
  name: string;
  formula: string;
  explanation: string;
}

interface FormulaReferenceProps {
  mode: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function FormulaReference({ mode, isVisible, onClose }: FormulaReferenceProps) {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use useCallback to memoize the loadFormulas function
  const loadFormulas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/formulas/by-mode/${mode}`);
      
      if (response.data && response.data.formulas) {
        setFormulas(response.data.formulas);
      } else {
        setFormulas([]);
      }
    } catch (err) {
      console.error('Error loading formulas:', err);
      setError('Failed to load formulas. Please try again later.');
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);
  
  useEffect(() => {
    if (isVisible && mode) {
      loadFormulas();
    }
  }, [isVisible, mode, loadFormulas]);
    const filteredFormulas = searchQuery 
    ? formulas.filter(formula => 
        formula.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        formula.formula.toLowerCase().includes(searchQuery.toLowerCase()))
    : formulas;
    // Render MathJax when formulas change or when search query changes
  useEffect(() => {
    if (filteredFormulas.length > 0) {
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
  }, [filteredFormulas]);
    
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Formula Reference Library</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : filteredFormulas.length === 0 ? (
            <div className="text-gray-400 text-center">
              {searchQuery ? 'No formulas match your search' : 'No formulas available for this mode'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFormulas.map((formula, index) => (                <div key={index} className="bg-gray-800 rounded p-4">
                  <h3 className="text-blue-400 font-bold">{formula.name}</h3>
                  <div className="mt-2 p-2 bg-gray-700 rounded">
                    <div className="latex-content text-white" dangerouslySetInnerHTML={{ __html: `\\(${formula.formula}\\)` }}></div>
                  </div>
                  <p className="mt-2 text-gray-300 text-sm">{formula.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
