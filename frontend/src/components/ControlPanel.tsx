import { Button } from '@/components/ui/button';
import { ColorSwatch, Group } from '@mantine/core';
import ModeSelector from '@/components/ModeSelector';
import { SWATCHES } from '@/constants';

interface ControlPanelProps {
  selectionMode: boolean;
  toggleSelectionMode: () => void;
  mathMode: string;
  setMathMode: (mode: string) => void;
  showDetailedSteps: boolean;
  setShowDetailedSteps: (show: boolean) => void;
  setShowFormulaReference: (show: boolean) => void;
  color: string;
  setColor: (color: string) => void;
  loading: boolean;
  selectionActive: boolean;
  runRoute: () => void;
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
  setShowFormulaReference,
  // We don't use color directly in this component, so we can omit it from destructuring
  setColor,
  loading,
  selectionActive,
  runRoute
}: ControlPanelProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-white border-b border-gray-200 shadow-sm'>
      <div className='flex flex-col space-y-2'>
        <Button 
          onClick={toggleSelectionMode} 
          className={`z-20 ${selectionMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
          variant='default' 
        >
          {selectionMode ? 'Return to Drawing Mode' : 'Switch to Selection Mode'}
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
        
        <Button
          onClick={() => setShowFormulaReference(true)}
          className='z-20 bg-gray-700 hover:bg-gray-800 text-white'
          variant='default'
        >
          Formula Reference
        </Button>
      </div>
    </div>
  );
}
