import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import ModeSelector from '@/components/ModeSelector';
import FormulaReference from '@/components/FormulaReference';
import StepByStepSolution from '@/components/StepByStepSolution';
// Import MathJax types for TypeScript support
import '@/types/mathjax';
// import {LazyBrush} from 'lazy-brush';

interface FormulaInfo {
  name: string;
  formula: string;
  explanation: string;
}

// Define a type that can represent all possible result types
type MathResult = string | number | boolean | null;

interface GeneratedResult {
    expression: string;
    answer: MathResult; // Using our custom type instead of any
    steps?: string[];
    formulas_used?: FormulaInfo[];
}

interface Response {
    expr: string;
    result: MathResult; // Using our custom type instead of any
    assign: boolean;
    steps?: string[];
    formulas_used?: FormulaInfo[];
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
    const [selectionActive, setSelectionActive] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [color, setColor] = useState('rgb(0, 0, 0)'); // Changed to black for white background
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [mathMode, setMathMode] = useState('basic');
    const [showDetailedSteps, setShowDetailedSteps] = useState(false);
    const [showFormulaReference, setShowFormulaReference] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);

    // const lazyBrush = new LazyBrush({
    //     radius: 10,
    //     enabled: true,
    //     initialPoint: { x: 0, y: 0 },
    // });
    
    const renderLatexToCanvas = useCallback((expression: string, answer: MathResult) => {
        // Format the LaTeX with proper sizing and escaping
        const escapedExpr = expression.replace(/\\/g, '\\\\');
        // Ensure answer is a string before calling replace
        const answerStr = String(answer);
        const escapedAnswer = answerStr.replace(/\\/g, '\\\\');
        // Use proper LaTeX formatting - with correct escaping for MathJax
        const latex = `\\(${escapedExpr} = ${escapedAnswer}\\)`;
        
        setLatexExpression(prevExpressions => [...prevExpressions, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

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

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result, renderLatexToCanvas]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const selectionCanvas = selectionCanvasRef.current;
    
        if (canvas && selectionCanvas) {
            const ctx = canvas.getContext('2d');
            const selectionCtx = selectionCanvas.getContext('2d');
            if (ctx && selectionCtx) {
                // Set canvas dimensions
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                selectionCanvas.width = window.innerWidth;
                selectionCanvas.height = window.innerHeight - canvas.offsetTop;
                
                // Configure canvas for drawing
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                ctx.strokeStyle = color; // Use current selected color
                
                // Set the drawing canvas to white background for light theme
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add resize handler to maintain canvas state on window resize
                const handleResize = () => {
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight - canvas.offsetTop;
                    selectionCanvas.width = window.innerWidth;
                    selectionCanvas.height = window.innerHeight - canvas.offsetTop;
                    
                    // Restore white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Restore drawing
                    ctx.putImageData(imgData, 0, 0);
                    
                    // Restore canvas settings
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = color;
                };
                
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            }
        }
    }, [color]); // Added color to the dependency array

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
        
        return () => {
            // Cleanup if needed
        };
    }, []);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        const selectionCanvas = selectionCanvasRef.current;
        
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white'; // For light theme
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
            }
        }
        
        // Reset selection state
        setSelectionActive(false);
        setSelectionMode(false);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectionMode) {
            startSelection(e);
            return;
        }
        
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };
    
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectionMode) {
            updateSelection(e);
            return;
        }
        
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };
    
    const stopDrawing = () => {
        if (selectionMode) {
            endSelection();
            return;
        }
        
        setIsDrawing(false);
    };
    
    // Selection functions
    const startSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        setIsSelecting(true);
        
        // Clear previous selection
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
            }
        }
    };
    
    const updateSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isSelecting) return;
        
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        
        setSelectionEnd({ x, y });
        
        // Draw selection rectangle
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                
                const width = x - selectionStart.x;
                const height = y - selectionStart.y;
                
                ctx.strokeRect(selectionStart.x, selectionStart.y, width, height);
                ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
                ctx.fillRect(selectionStart.x, selectionStart.y, width, height);
            }
        }
    };
    
    const endSelection = () => {
        setIsSelecting(false);
        setSelectionActive(true);
    };
    
    const toggleSelectionMode = () => {
        setSelectionMode(prev => !prev);
        if (!selectionMode) {
            setSelectionActive(false);
            
            // Clear selection canvas when entering selection mode
            const selectionCanvas = selectionCanvasRef.current;
            if (selectionCanvas) {
                const ctx = selectionCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
                }
            }
        }
    };  

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            try {
                setLoading(true);
                
                // Handle selected area if selection is active
                let imageData;
                let boundingRect = {
                    minX: 0,
                    minY: 0,
                    maxX: canvas.width,
                    maxY: canvas.height
                };

                if (selectionActive && selectionMode) {
                    // Create a temporary canvas for the selected area
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Calculate selection bounds (ensure start < end)
                    const startX = Math.min(selectionStart.x, selectionEnd.x);
                    const startY = Math.min(selectionStart.y, selectionEnd.y);
                    const width = Math.abs(selectionEnd.x - selectionStart.x);
                    const height = Math.abs(selectionEnd.y - selectionStart.y);
                    
                    // Set temp canvas size to selection size
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    
                    // Copy selected region to temp canvas
                    tempCtx!.drawImage(
                        canvas,
                        startX, startY, width, height,
                        0, 0, width, height
                    );
                    
                    // Use the temp canvas for the API call
                    imageData = tempCanvas.toDataURL('image/png');
                    
                    // Update bounding rect for position calculation
                    boundingRect = {
                        minX: startX,
                        minY: startY,
                        maxX: startX + width,
                        maxY: startY + height
                    };
                } else {
                    // Use the entire canvas
                    imageData = canvas.toDataURL('image/png');
                }
                
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: imageData,
                        dict_of_vars: dictOfVars,
                        mode: mathMode,
                        detailed_steps: showDetailedSteps
                    }
                });

                const resp = await response.data;
                console.log('Response', resp);
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });
                
                // Calculate positioning based on the bounding rect (either selection or whole canvas)
                const centerX = (boundingRect.minX + boundingRect.maxX) / 2;
                const centerY = (boundingRect.minY + boundingRect.maxY) / 2;

                setLatexPosition({ x: centerX, y: centerY });
                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result,
                            steps: data.steps,
                            formulas_used: data.formulas_used
                        });
                    }, 1000);
                });
            } catch (error) {
                console.error('Error in API call:', error);
                // You could add user-friendly error handling here
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-white border-b border-gray-200 shadow-sm'>
                <div className='flex flex-col space-y-2'>
                    <Button
                        onClick={() => setReset(true)}
                        className='z-20 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                        variant='default' 
                    >
                        Reset
                    </Button>
                    
                    <Button
                        onClick={toggleSelectionMode}
                        className={`z-20 ${selectionMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                        variant='default' 
                    >
                        {selectionMode ? 'Selection Mode: ON' : 'Selection Mode: OFF'}
                    </Button>
                    
                    <ModeSelector
                        selectedMode={mathMode}
                        onModeChange={setMathMode}
                        showDetailedSteps={showDetailedSteps}
                        onToggleDetailedSteps={() => setShowDetailedSteps(prev => !prev)}
                    />
                </div>

                <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                    ))}
                </Group>
                
                <div className='flex flex-col space-y-2'>
                    <Button
                        onClick={runRoute}
                        className='z-20 bg-blue-500 hover:bg-blue-600 text-white'
                        variant='default'
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                                Processing...
                            </div>
                        ) : 'Solve'}
                    </Button>
                    
                    <Button
                        onClick={() => setShowFormulaReference(true)}
                        className='z-20 bg-gray-700 hover:bg-gray-800 text-white'
                        variant='default'
                    >
                        Formula Reference
                    </Button>
                </div>
            </div>

            <div className="relative w-full h-[calc(100vh-4rem)]">
                <canvas
                    ref={canvasRef}
                    id='canvas'
                    className='absolute top-16 left-0 w-full h-[calc(100vh-4rem)]'
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                />
                <canvas
                    ref={selectionCanvasRef}
                    id='selectionCanvas'
                    className='absolute top-16 left-0 w-full h-[calc(100vh-4rem)] z-10 pointer-events-none'
                />
            </div>

            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-3 text-gray-900 bg-white border border-gray-200 rounded-lg shadow-md">
                        <div className="latex-content math-output" dangerouslySetInnerHTML={{ __html: latex }}></div>
                        
                        {result && result.steps && result.steps.length > 0 && showDetailedSteps && (
                            <StepByStepSolution 
                                steps={result.steps} 
                                formulas={result.formulas_used || null} 
                            />
                        )}
                    </div>
                </Draggable>
            ))}

            <FormulaReference 
                mode={mathMode}
                isVisible={showFormulaReference}
                onClose={() => setShowFormulaReference(false)}
            />
        </>
    );
}
