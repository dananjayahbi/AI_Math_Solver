import { useState, useEffect } from 'react';
import FormulaReference from '@/components/FormulaReference';
import ControlPanel from '@/components/ControlPanel';
import LatexAnswer from '@/components/LatexAnswer';
import { useCanvas } from '@/hooks/useCanvas';
import { useSelection } from '@/hooks/useSelection';
import { useLatexRenderer } from '@/hooks/useLatexRenderer';
import { useApiIntegration } from '@/hooks/useApiIntegration';
// Import MathJax types for TypeScript support
import '@/types/mathjax';

export default function Home() {
    // State management
    const [color, setColor] = useState('rgb(0, 0, 0)'); // Changed to black for white background
    const [reset, setReset] = useState(false);
    const [mathMode, setMathMode] = useState('basic');
    const [showDetailedSteps, setShowDetailedSteps] = useState(false);
    const [showFormulaReference, setShowFormulaReference] = useState(false);

    // Use custom hooks
    const { canvasRef, startDrawing, draw, stopDrawing, resetCanvas } = useCanvas(color);
    
    const { 
        selectionCanvasRef, 
        selectionPath, 
        selectionBounds, 
        selectionCenter, 
        selectionActive, 
        isPointInPath,
        setSelectionActive,
        selectionMode,
        setSelectionMode,
        startSelection,
        updateSelection,
        endSelection
    } = useSelection();
    
    const { 
        latexExpression, 
        renderLatexToCanvas, 
        setLatexExpression 
    } = useLatexRenderer();
    
    const {
        loading,
        result,
        processMathApi,
        setResult,
        setDictOfVars
    } = useApiIntegration();

    // Since we're handling interactions directly, we don't need these intermediate functions anymore

    const toggleSelectionMode = () => {
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

    // MathJax configuration effect
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

        // Add custom styles for dragging functionality
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            .dragging {
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
                opacity: 0.9 !important;
                transform: scale(1.02) !important;
                z-index: 50 !important;
            }
            .latex-answer-container:hover {
                background-color: rgba(255, 255, 255, 0.98) !important;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18) !important;
            }
        `;
        document.head.appendChild(styleEl);
        
        return () => {
            // Cleanup
            if (styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, []);

    // Effect to typeset LaTeX when it changes
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

    // Effect to render LaTeX when result changes
    useEffect(() => {
        if (result) {
            // Clear existing answers before rendering a new one
            setLatexExpression([]);
            renderLatexToCanvas(
                result.expression, 
                result.answer,
                selectionCenter,
                selectionBounds
            );
        }
    }, [result, renderLatexToCanvas, selectionCenter, selectionBounds, setLatexExpression]);

    // Effect to reset the canvas when reset is true
    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset, resetCanvas, setLatexExpression, setResult, setDictOfVars]);

    // Handle the API call
    const runRoute = async () => {
        const canvas = canvasRef.current;
        
        if (canvas) {
            await processMathApi(
                canvas,
                selectionMode,
                selectionActive,
                selectionBounds,
                selectionCenter,
                selectionPath,
                mathMode,
                isPointInPath
            );
        }
    };

    // Handle position change for LaTeX expressions
    const handleLatexPositionChange = (index: number, x: number, y: number) => {
        const newExpressions = [...latexExpression];
        newExpressions[index].position = { 
            x: x - 40, // Subtract the offset we applied in LatexAnswer
            y: y + 30  // Subtract the offset we applied in LatexAnswer
        };
        setLatexExpression(newExpressions);
    };

    // Handle deletion of LaTeX expressions
    const handleLatexDelete = (index: number) => {
        const newExpressions = latexExpression.filter((_, i) => i !== index);
        setLatexExpression(newExpressions);
    };

    // Define the handlers for drawing operations
    const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        startDrawing(e);
    };

    const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        draw(e);
    };

    const handleStopDrawing = () => {
        stopDrawing();
    };

    return (
        <>
            <ControlPanel 
                selectionMode={selectionMode}
                toggleSelectionMode={toggleSelectionMode}
                mathMode={mathMode}
                setMathMode={setMathMode}
                showDetailedSteps={showDetailedSteps}
                setShowDetailedSteps={setShowDetailedSteps}
                setShowFormulaReference={setShowFormulaReference}
                color={color}
                setColor={setColor}
                loading={loading}
                selectionActive={selectionActive}
                runRoute={runRoute}
            />
            
            <div className="relative w-full h-[calc(100vh-4rem)]" id="canvas-container">
                <canvas
                    ref={canvasRef}
                    id='canvas'
                    className='absolute top-16 left-0 w-full h-[calc(100vh-4rem)]'
                    onMouseDown={handleStartDrawing}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDrawing}
                    onMouseOut={handleStopDrawing}
                />
                <canvas
                    ref={selectionCanvasRef}
                    id='selectionCanvas'
                    className={`absolute top-16 left-0 w-full h-[calc(100vh-4rem)] z-10 ${!selectionMode ? 'pointer-events-none' : ''}`}
                    onMouseDown={selectionMode ? startSelection : undefined}
                    onMouseMove={selectionMode ? updateSelection : undefined}
                    onMouseUp={selectionMode ? endSelection : undefined}
                    onMouseOut={selectionMode ? endSelection : undefined}
                />
                
                {/* Fixed positioned container for LaTeX output - positioned relative to the canvas */}
                <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] pointer-events-none z-20">
                    {latexExpression && latexExpression.map((item, index) => (
                        <LatexAnswer
                            key={index}
                            item={item}
                            index={index}
                            steps={result?.steps}
                            formulas={result?.formulas_used}
                            showDetailedSteps={showDetailedSteps}
                            onPositionChange={handleLatexPositionChange}
                            onDelete={handleLatexDelete}
                        />
                    ))}
                </div>
            </div>

            <FormulaReference 
                mode={mathMode}
                isVisible={showFormulaReference}
                onClose={() => setShowFormulaReference(false)}
            />
        </>
    );
}
