import { Button } from '@/components/ui/button';
import { ColorSwatch, Group, Tooltip } from '@mantine/core';
import ModeSelector from '@/components/ModeSelector';
import { SWATCHES } from '@/constants';
import { Pencil, MousePointer, Eraser, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  selectionMode: boolean;
  toggleSelectionMode: () => void;
  mathMode: string;
  setMathMode: (mode: string) => void;
  showDetailedSteps: boolean;
  setShowDetailedSteps: (show: boolean) => void;
  color: string;
  setColor: (color: string) => void;
  loading: boolean;
  selectionActive: boolean;
  runRoute: () => void;
  resetCanvas: () => void;
  enableEraser: boolean;
  toggleEraser: () => void;
}

/**
 * Component for the control panel at the top of the screen
 */
export default function ControlPanel({
  selectionMode,
  toggleSelectionMode,
  mathMode,
  setMathMode,
  showDetailedSteps,
  setShowDetailedSteps,
  // We don't use color directly in this component, so we can omit it from destructuring
  setColor,
  loading,
  selectionActive,
  runRoute,
  resetCanvas,
  enableEraser,
  toggleEraser
}: ControlPanelProps) {
  
  // Confirmation dialog for reset
  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      resetCanvas();
    }
  };
  
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-white border-b border-gray-200 shadow-sm'>
      <div className='flex items-center space-x-2'>
        {/* Drawing/Selection Mode Toggle Button */}
        <Tooltip label={selectionMode ? "Drawing Mode" : "Selection Mode"} withArrow position="bottom">
          <Button 
            onClick={toggleSelectionMode} 
            className={`z-20 h-10 w-10 p-0 ${selectionMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
            variant='default'
            aria-label={selectionMode ? "Switch to drawing mode" : "Switch to selection mode"}
          >
            {selectionMode ? <Pencil size={18} /> : <MousePointer size={18} />}
          </Button>
        </Tooltip>
        
        {/* Eraser Tool Button */}
        <Tooltip label="Eraser Tool" withArrow position="bottom">
          <Button
            onClick={toggleEraser}
            className={`z-20 h-10 w-10 p-0 ${enableEraser ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
            variant='default'
            disabled={selectionMode}
            aria-label="Eraser tool"
          >
            <Eraser size={18} />
          </Button>
        </Tooltip>
        
        {/* Reset Canvas Button */}
        <Tooltip label="Clear Canvas" withArrow position="bottom">
          <Button
            onClick={handleReset}
            className="z-20 h-10 w-10 p-0 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
            variant='default'
            aria-label="Clear canvas"
          >
            <RotateCcw size={18} />
          </Button>
        </Tooltip>
        
        {/* Math Mode Selector */}
        <div className="ml-2">
          <ModeSelector
            selectedMode={mathMode}
            onModeChange={setMathMode}
            showDetailedSteps={showDetailedSteps}
            onToggleDetailedSteps={() => setShowDetailedSteps((prev: boolean) => !prev)}
          />
        </div>
      </div>

      {/* Color Palette */}
      <Group className='z-20 flex justify-center'>
        {SWATCHES.map((swatch) => (
          <ColorSwatch 
            key={swatch} 
            color={swatch} 
            onClick={() => setColor(swatch)}
            className="cursor-pointer"
            style={{ border: '1px solid #ddd', width: '24px', height: '24px' }}
          />
        ))}
      </Group>
      
      <div className='flex flex-col space-y-2'>        <div className="relative">
          <Button
            onClick={runRoute}
            className={`z-20 w-full ${
              loading || !selectionActive
                ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-all duration-200`}
            disabled={loading || !selectionActive}
            title={!selectionActive ? "Draw a selection around a math problem first" : ""}
          >            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Processing...
              </div>
            ) : (
              selectionActive ? 'Solve Selected Area' : 'Draw Selection First'
            )}
          </Button>          {!selectionActive && (
            <div className="absolute -bottom-8 left-0 right-0 text-xs font-medium text-blue-500 text-center bg-blue-50 p-1 rounded-md border border-blue-200 shadow-sm">
              Draw around an equation to enable solving
            </div>
          )}
        </div>
          {/* Formula Reference button removed */}
      </div>
    </div>
  );
}
