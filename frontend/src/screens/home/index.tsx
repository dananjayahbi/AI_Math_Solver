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

interface LatexExpressionItem {
    latex: string;
    position: { x: number; y: number };
}

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
    
    // For free-form selection
    const [selectionPath, setSelectionPath] = useState<Array<{x: number, y: number}>>([]);
    const [selectionBounds, setSelectionBounds] = useState<{minX: number, minY: number, maxX: number, maxY: number} | null>(null);
    const [selectionCenter, setSelectionCenter] = useState<{x: number, y: number} | null>(null);
    
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
    const [latexExpression, setLatexExpression] = useState<Array<LatexExpressionItem>>([]);

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
        
        // Only add new LaTeX answers to the position where the selection was made
        console.log('Adding LaTeX at position:', latexPosition);
        // Use the current center point of the selection for positioning
        setLatexExpression(prevExpressions => [
            ...prevExpressions, 
            {
                latex: latex,
                position: {
                    x: latexPosition.x,
                    y: latexPosition.y
                }
            }
        ]);

        // Reset selection but do not clear the canvas
        setSelectionActive(false);
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
            }
        }
    }, [latexPosition]);

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
            renderLatexToCanvas(
                result.expression, 
                result.answer
            );
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
    
    // Function to calculate if a point is inside a polygon (free-form selection)
    // This is used for pixel-level masking in the free-form selection
    // The function is called for each pixel in the selection area in runRoute()
    const isPointInPath = (point: {x: number, y: number}, path: Array<{x: number, y: number}>): boolean => {
        // Point-in-polygon algorithm (ray casting)
        let inside = false;
        for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
            const xi = path[i].x, yi = path[i].y;
            const xj = path[j].x, yj = path[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };
    
    // Function to calculate the bounding box and center of a path
    const calculatePathBounds = (path: Array<{x: number, y: number}>) => {
        if (path.length === 0) return null;
        
        let minX = path[0].x;
        let minY = path[0].y;
        let maxX = path[0].x;
        let maxY = path[0].y;
        
        path.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        // Calculate center
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        return {
            bounds: { minX, minY, maxX, maxY },
            center: { x: centerX, y: centerY }
        };
    };

    // Selection functions - now with free-form selection
    const startSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        
        // Initialize a new path with the starting point
        setSelectionPath([{ x, y }]);
        setIsSelecting(true);
        
        // Clear previous selection
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
                
                // Start a new path
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
            }
        }
    };
    
    const updateSelection = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isSelecting) return;
        
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        
        // Add the new point to the path
        setSelectionPath(prev => [...prev, { x, y }]);
        
        // Draw the selection path
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                // Clear the canvas and redraw the entire path
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
                
                // Draw the entire path with a smoother appearance
                ctx.beginPath();
                ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
                
                for (let i = 1; i < selectionPath.length; i++) {
                    ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
                }
                
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Add a subtle fill to show the selected area
                ctx.fillStyle = 'rgba(0, 123, 255, 0.08)';
                ctx.fill();
            }
        }
    };
    
    const endSelection = () => {
        setIsSelecting(false);
        
        // Close the path if needed
        const selectionCanvas = selectionCanvasRef.current;
        if (selectionCanvas && selectionPath.length > 2) {
            const ctx = selectionCanvas.getContext('2d');
            if (ctx) {
                // Clear and redraw the entire path to ensure it's closed correctly
                ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
                
                // Draw the complete path with the first point added at the end to close it
                ctx.beginPath();
                ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
                
                // Draw all points
                for (let i = 1; i < selectionPath.length; i++) {
                    ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
                }
                
                // Close back to the first point
                ctx.lineTo(selectionPath[0].x, selectionPath[0].y);
                
                // Style the outline
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Fill the selection area
                ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
                ctx.fill();
                
                // Calculate the bounds and center of the selection
                const pathInfo = calculatePathBounds(selectionPath);
                if (pathInfo) {
                    setSelectionBounds(pathInfo.bounds);
                    setSelectionCenter(pathInfo.center);
                    setSelectionActive(true);
                    
                    // Add a visual indicator at the center point
                    ctx.beginPath();
                    ctx.arc(pathInfo.center.x, pathInfo.center.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 123, 255, 0.6)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        } else {
            // Clear the selection if it's too small
            setSelectionPath([]);
            setSelectionActive(false);
        }
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
    
    // Helper function to get canvas position relative to the viewport (now inlined where needed)

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
                let centerPoint = {
                    x: canvas.width / 2,
                    y: canvas.height / 2
                };

                if (selectionActive && selectionMode) {
                    // Create a temporary canvas for the selected area
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    if (selectionBounds && selectionCenter && selectionPath.length > 2) {
                        // Use the free-form selection bounds
                        boundingRect = selectionBounds;
                        centerPoint = selectionCenter;
                        
                        // Calculate width and height from bounds
                        const width = boundingRect.maxX - boundingRect.minX;
                        const height = boundingRect.maxY - boundingRect.minY;
                        
                        // Set temp canvas size to selection size
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        
                        // Create a masked version of the selection area using pixel-level masking
                        tempCtx!.save();
                        
                        // First, draw the original image to the temp canvas
                        tempCtx!.drawImage(
                            canvas,
                            boundingRect.minX, boundingRect.minY, width, height,
                            0, 0, width, height
                        );
                        
                        // Create an image data object to manipulate pixels
                        const tempImageData = tempCtx!.getImageData(0, 0, width, height);
                        const data = tempImageData.data;
                        
                        // Apply pixel-level masking using isPointInPath
                        // Use a faster approach - check every 4th pixel for large areas
                        // and every pixel near the border for precision
                        const padding = 5; // Pixels to check at full resolution near the border
                        
                        // Calculate the shape border area
                        const border = {
                            minX: Math.max(0, Math.floor((selectionBounds.minX - boundingRect.minX) - padding)),
                            minY: Math.max(0, Math.floor((selectionBounds.minY - boundingRect.minY) - padding)),
                            maxX: Math.min(width, Math.ceil((selectionBounds.maxX - boundingRect.minX) + padding)),
                            maxY: Math.min(height, Math.ceil((selectionBounds.maxY - boundingRect.minY) + padding))
                        };
                        
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                // Convert to original canvas coordinates
                                const origX = x + boundingRect.minX;
                                const origY = y + boundingRect.minY;
                                
                                // Skip some pixels in non-border areas for performance
                                const isInBorderArea = 
                                    x >= border.minX && x <= border.maxX && 
                                    y >= border.minY && y <= border.maxY;
                                    
                                // Check fewer pixels in the center (every 4th) but all pixels near the border
                                if (isInBorderArea || (x % 4 === 0 && y % 4 === 0)) {
                                    // Check if this pixel is inside the selection path
                                    if (!isPointInPath({x: origX, y: origY}, selectionPath)) {
                                        // If not inside, make this pixel and nearby pixels transparent
                                        const pixelIndex = (y * width + x) * 4;
                                        data[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
                                        
                                        // If we're skipping pixels, also set the neighbors transparent
                                        if (!isInBorderArea) {
                                            // Make the next 3 pixels in each direction transparent too
                                            for (let ny = 0; ny < 4 && y + ny < height; ny++) {
                                                for (let nx = 0; nx < 4 && x + nx < width; nx++) {
                                                    if (nx === 0 && ny === 0) continue; // Skip the pixel we already set
                                                    const neighborIdx = ((y + ny) * width + (x + nx)) * 4;
                                                    data[neighborIdx + 3] = 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Put the modified image data back to the canvas
                        tempCtx!.putImageData(tempImageData, 0, 0);
                        
                        // Also draw the path for visualization
                        tempCtx!.beginPath();
                        tempCtx!.moveTo(
                            selectionPath[0].x - boundingRect.minX,
                            selectionPath[0].y - boundingRect.minY
                        );
                        
                        for (let i = 1; i < selectionPath.length; i++) {
                            tempCtx!.lineTo(
                                selectionPath[i].x - boundingRect.minX,
                                selectionPath[i].y - boundingRect.minY
                            );
                        }
                        
                        // Close the path and draw a subtle outline
                        tempCtx!.closePath();
                        
                        // Update the imageData string with our pixel-masked canvas
                        imageData = tempCanvas.toDataURL('image/png');
                        
                        tempCtx!.restore();
                        
                        // Use the masked temp canvas for the API call
                        imageData = tempCanvas.toDataURL('image/png');
                    } else {
                        // Fallback to full canvas if selection is invalid
                        imageData = canvas.toDataURL('image/png');
                    }
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
                
                // Use the calculated center point from the selection
                console.log('Selection center:', centerPoint);
                console.log('Bounds:', boundingRect);
                
                // Use the center point directly - it's already correct for positioning
                const newPosition = {
                    x: centerPoint.x,
                    y: centerPoint.y 
                };
                
                console.log('Setting LaTeX position to:', newPosition);
                
                setLatexPosition(newPosition);
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
                    <div className="relative">
                        <Button
                            onClick={runRoute}
                            className={`z-20 w-full ${
                                loading || (selectionMode && !selectionActive) 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                            } text-white`}
                            variant='default'
                            disabled={loading || (selectionMode && !selectionActive)}
                            title={selectionMode && !selectionActive ? "Draw a selection around a math problem first" : ""}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                                    Processing...
                                </div>
                            ) : 'Solve'}
                        </Button>
                        {selectionMode && !selectionActive && (
                            <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 text-center">
                                Draw a selection first
                            </div>
                        )}
                    </div>
                    
                    <Button
                        onClick={() => setShowFormulaReference(true)}
                        className='z-20 bg-gray-700 hover:bg-gray-800 text-white'
                        variant='default'
                    >
                        Formula Reference
                    </Button>
                </div>
            </div>

            <div className="relative w-full h-[calc(100vh-4rem)]" id="canvas-container">
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
                
                {/* Fixed positioned container for LaTeX output - positioned relative to the canvas */}
                <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] pointer-events-none z-20">
                {/* Simple debug overlay to visualize positions */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {latexExpression && latexExpression.map((item, index) => (
                        <circle 
                            key={`debug-${index}`}
                            cx={item.position.x} 
                            cy={item.position.y}
                            r="3" 
                            fill="rgba(255, 0, 0, 0.7)" 
                        />
                    ))}
                </svg>
                {latexExpression && latexExpression.map((item, index) => (
                    <Draggable
                        key={index}
                        defaultPosition={{
                            // Center the LaTeX element precisely over the selection point
                            x: item.position.x,
                            y: item.position.y
                        }}
                        positionOffset={{
                            x: -150, // Center horizontally (approximately half the width)
                            y: -40   // Position slightly above the equation
                        }}
                        bounds="parent"
                        onStop={(_, data) => {
                            // Update the position when dragging stops
                            const newExpressions = [...latexExpression];
                            newExpressions[index].position = { 
                                x: data.x,
                                y: data.y 
                            };
                            setLatexExpression(newExpressions);
                        }}
                    >
                        <div className="pointer-events-auto latex-answer-container animate-fade-in relative cursor-move">
                            <button 
                                className="absolute -top-2 -right-2 bg-gray-200 bg-opacity-80 hover:bg-gray-300 text-gray-600 w-5 h-5 flex items-center justify-center rounded-full text-xs cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newExpressions = latexExpression.filter((_, i) => i !== index);
                                    setLatexExpression(newExpressions);
                                }}
                            >
                                ×
                            </button>
                            <div className="latex-content math-output" dangerouslySetInnerHTML={{ __html: item.latex }}></div>
                            
                            {result && result.steps && result.steps.length > 0 && showDetailedSteps && (
                                <StepByStepSolution 
                                    steps={result.steps} 
                                    formulas={result.formulas_used || null} 
                                />
                            )}
                        </div>
                    </Draggable>
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
