import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import ModeSelector from '@/components/ModeSelector';
import FormulaReference from '@/components/FormulaReference';
import StepByStepSolution from '@/components/StepByStepSolution';
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
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
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
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }
        
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
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };
    
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        setIsDrawing(false);
    };  

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            try {
                setLoading(true);
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars,
                        mode: mathMode,
                        detailed_steps: showDetailedSteps
                    }
                });

                const resp = await response.data;
                console.log('Response', resp);
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        // dict_of_vars[resp.result] = resp.answer;
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });
                
                const ctx = canvas.getContext('2d');
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

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
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-gray-900'>
                <div className='flex flex-col space-y-2'>
                    <Button
                        onClick={() => setReset(true)}
                        className='z-20 bg-slate-800 hover:bg-slate-700 text-white'
                        variant='default' 
                    >
                        Reset
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
                        className='z-20 bg-slate-800 hover:bg-slate-700 text-white'
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
                        className='z-20 bg-blue-800 hover:bg-blue-700 text-white'
                        variant='default'
                    >
                        Formula Reference
                    </Button>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-16 left-0 w-full h-[calc(100%-4rem)]'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-2 text-white bg-black bg-opacity-50 rounded shadow-md">
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
