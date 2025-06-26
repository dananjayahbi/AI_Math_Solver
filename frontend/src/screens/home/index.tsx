import { useState, useEffect } from 'react';
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
    const [enableEraser, setEnableEraser] = useState(false);    // Use custom hooks
    const { canvasRef, startDrawing, draw, stopDrawing, resetCanvas, isDrawing } = useCanvas(color, enableEraser);
    
    // Use useSelection hook
    const { 
        selectionCanvasRef, 
        selectionPath,
        setSelectionPath,
        selectionBounds, 
        setSelectionBounds,
        selectionCenter, 
        setSelectionCenter,
        selectionActive, 
        isPointInPath,
        setSelectionActive,
        selectionMode,
        setSelectionMode
    } = useSelection();
    
    // Local state for selection operations
    const [isSelecting, setIsSelecting] = useState(false);
    
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
        // Log the current state before toggling
        console.log('Current selectionMode before toggle:', selectionMode);
        
        // End any ongoing selection or drawing
        setIsSelecting(false);
        if (isDrawing) {
            stopDrawing();
        }
        
        setSelectionMode(prevMode => {
            const newMode = !prevMode;
            console.log('Setting selectionMode to:', newMode);
            return newMode;
        });
        
        // Reset selection state
        setSelectionActive(false);
        setSelectionPath([]); // Clear the selection path
        setSelectionBounds(null);
        setSelectionCenter(null);
        
        // Clear selection canvas
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            // Make sure the canvas is properly sized
            selectionCanvas.width = window.innerWidth;
            selectionCanvas.height = window.innerHeight - selectionCanvas.offsetTop;
            
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
            }
        }
        
        console.log('Mode toggled, selection canvas cleared');
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

    // Debug effect to track selectionMode changes
    useEffect(() => {
        console.log('selectionMode changed:', selectionMode);
        
        // Check and log the z-index and pointer-events of both canvases
        const mainCanvas = canvasRef.current;
        const selCanvas = selectionCanvasRef.current;
        
        if (mainCanvas && selCanvas) {
            console.log('Main canvas style:', {
                zIndex: window.getComputedStyle(mainCanvas).zIndex,
                pointerEvents: window.getComputedStyle(mainCanvas).pointerEvents
            });
            
            console.log('Selection canvas style:', {
                zIndex: window.getComputedStyle(selCanvas).zIndex,
                pointerEvents: window.getComputedStyle(selCanvas).pointerEvents
            });
            
            // Ensure the selection canvas has proper dimensions
            selCanvas.width = window.innerWidth;
            selCanvas.height = window.innerHeight - selCanvas.offsetTop;
        }
    }, [selectionMode, canvasRef, selectionCanvasRef]);    // Handle the API call
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
                isPointInPath  // We're still passing the function, but it won't be used internally
            );
        }
    };// Handle position change for LaTeX expressions
    const handleLatexPositionChange = (index: number, x: number, y: number) => {
        console.log(`Setting new position for latex ${index}: x=${x}, y=${y}`);
        
        // Use functional update to avoid stale state issues
        setLatexExpression(prevExpressions => {
            return prevExpressions.map((expr, i) => {
                if (i === index) {
                    return {
                        ...expr,
                        position: { 
                            x, // Store the exact position
                            y  // Store the exact position
                        }
                    };
                }
                return expr;
            });
        });
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

    // Define custom selection handlers that work more reliably
    const handleStartSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        console.log('Direct handleStartSelection called', e.clientX, e.clientY, 'Selection mode:', selectionMode);
        
        // Prevent default to stop any browser handling
        e.preventDefault();
        
        if (!selectionMode) {
            console.log('Not in selection mode, ignoring selection start');
            return;
        }
        
        // Get the canvas reference and context
        const canvas = selectionCanvasRef.current;
        if (canvas) {
            // Calculate canvas coordinates from mouse event
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log('Starting selection at', x, y);
            
            // Clear any previous selection
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Make sure the canvas is properly sized
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw initial point
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 123, 255, 0.7)';
                ctx.fill();
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Initialize selection path
                setSelectionPath([{ x, y }]);
                
                // Update state
                setIsSelecting(true);
                setSelectionActive(false);
            }
        }
    };
    
    const handleUpdateSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        console.log('updateSelection called, selectionMode:', selectionMode, 'isSelecting:', isSelecting);
        
        // Prevent default to stop any browser handling
        e.preventDefault();
        
        if (!selectionMode || !isSelecting) {
            return;
        }
        
        const canvas = selectionCanvasRef.current;
        if (canvas && selectionPath.length > 0) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log('Selection point added:', x, y);
            
            // Add new point to the path
            const newPath = [...selectionPath, { x, y }];
            setSelectionPath(newPath);
            
            // Draw the updated path
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw the path
                ctx.beginPath();
                ctx.moveTo(newPath[0].x, newPath[0].y);
                
                for (let i = 1; i < newPath.length; i++) {
                    ctx.lineTo(newPath[i].x, newPath[i].y);
                }
                
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Add a subtle fill
                ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
                ctx.fill();
                
                // Draw points for better visualization during development
                for (const point of newPath) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 123, 255, 0.7)';
                    ctx.fill();
                }
            }
        }
    };
    
    const handleEndSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        console.log('endSelection called, selectionMode:', selectionMode, 'isSelecting:', isSelecting);
        
        // Prevent default to stop any browser handling
        if (e) e.preventDefault();
        
        if (!selectionMode || !isSelecting) {
            return;
        }
        
        const canvas = selectionCanvasRef.current;
        if (canvas && selectionPath.length > 2) {
            console.log('Completing selection with', selectionPath.length, 'points');
            
            // Calculate the bounds
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Close the path
                ctx.beginPath();
                ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
                
                for (let i = 1; i < selectionPath.length; i++) {
                    ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
                }
                
                // Close the path back to the first point
                ctx.lineTo(selectionPath[0].x, selectionPath[0].y);
                
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Fill with semi-transparent color
                ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
                ctx.fill();
                
                // Calculate bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                // Find min/max coordinates
                for (const point of selectionPath) {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                }
                
                console.log('Selection bounds:', { minX, minY, maxX, maxY });
                
                // Set selection bounds
                setSelectionBounds({
                    minX, minY, maxX, maxY
                });
                
                // Calculate center
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                
                console.log('Selection center:', { x: centerX, y: centerY });
                
                setSelectionCenter({ x: centerX, y: centerY });
                
                // Draw center indicator
                ctx.beginPath();
                ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 123, 255, 0.7)';
                ctx.fill();
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Add crosshair at center
                ctx.beginPath();
                ctx.moveTo(centerX - 10, centerY);
                ctx.lineTo(centerX + 10, centerY);
                ctx.moveTo(centerX, centerY - 10);
                ctx.lineTo(centerX, centerY + 10);
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Set selection as active
                setSelectionActive(true);
            }
        } else {
            console.log('Selection path too short or no canvas');
        }
        
        // End selection mode
        setIsSelecting(false);
    };    // Toggle eraser mode
    const toggleEraser = () => {
        if (selectionMode) return; // Don't allow eraser in selection mode
        
        // Log for debugging
        console.log('Toggling eraser from', enableEraser, 'to', !enableEraser);
        
        // Toggle eraser state without resetting the canvas
        setEnableEraser(prev => !prev);
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
                color={color}
                setColor={setColor}
                loading={loading}
                selectionActive={selectionActive}
                runRoute={runRoute}
                resetCanvas={resetCanvas}
                enableEraser={enableEraser}
                toggleEraser={toggleEraser}
            />
            
            <div className="relative w-full h-[calc(100vh-4rem)]" id="canvas-container">                <canvas
                    ref={canvasRef}
                    id='canvas'
                    style={{ 
                        zIndex: selectionMode ? 0 : 10,
                        pointerEvents: selectionMode ? 'none' : 'auto'
                    }}
                    className={`absolute top-16 left-0 w-full h-[calc(100vh-4rem)] ${
                        selectionMode 
                          ? 'cursor-default' 
                          : enableEraser 
                            ? 'cursor-eraser' 
                            : 'cursor-pencil'
                    }`}
                    onMouseDown={!selectionMode ? handleStartDrawing : undefined}
                    onMouseMove={!selectionMode ? handleDraw : undefined}
                    onMouseUp={!selectionMode ? handleStopDrawing : undefined}
                    onMouseOut={!selectionMode ? handleStopDrawing : undefined}
                />
                {/* Use a conditional to re-render the selection canvas when selectionMode changes */}                <canvas
                    key={selectionMode ? 'selection-active' : 'selection-inactive'}
                    ref={selectionCanvasRef}
                    id='selectionCanvas'
                    style={{ 
                        zIndex: selectionMode ? 15 : 0,
                        pointerEvents: selectionMode ? 'auto' : 'none',
                        cursor: selectionMode ? 'crosshair' : 'default'
                    }}
                    className={`absolute top-16 left-0 w-full h-[calc(100vh-4rem)] ${selectionMode ? 'cursor-crosshair' : ''}`}
                    onMouseDown={selectionMode ? (e) => {
                        console.log('Raw onMouseDown event on selection canvas');
                        handleStartSelection(e);
                    } : undefined}
                    onMouseMove={selectionMode ? (e) => {
                        if (isSelecting) {
                            handleUpdateSelection(e);
                        }
                    } : undefined}
                    onMouseUp={selectionMode ? (e) => handleEndSelection(e) : undefined}
                    onMouseOut={selectionMode ? (e) => handleEndSelection(e) : undefined}                />                {/* Fixed positioned container for LaTeX output - positioned relative to the canvas */}
                <div 
                  className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] z-20" 
                  id="latex-container" 
                  style={{ 
                    touchAction: "none", 
                    overflow: "visible",
                    position: "absolute",
                    pointerEvents: "auto"
                  }}>
                    {latexExpression && latexExpression.map((item, index) => (
                        <LatexAnswer
                            key={`latex-answer-${index}`}
                            item={item}
                            index={index}
                            steps={result?.steps}
                            formulas={result?.formulas_used}
                            showDetailedSteps={showDetailedSteps}
                            onPositionChange={handleLatexPositionChange}                            onDelete={handleLatexDelete}
                        />
                    ))}                </div>
            </div>
        </>
    );
}
