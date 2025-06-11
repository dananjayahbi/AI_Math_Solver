import { useState } from 'react';
import { MATH_MODES } from '@/constants';

interface ModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  showDetailedSteps: boolean;
  onToggleDetailedSteps: () => void;
}

export default function ModeSelector({
  selectedMode,
  onModeChange,
  showDetailedSteps,
  onToggleDetailedSteps
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModeSelect = (mode: string) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  const selectedModeInfo = MATH_MODES.find(mode => mode.id === selectedMode);
  return (
    <div className="relative z-30">
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-4 py-2 rounded-md w-full"
          >
            <span className="flex items-center">
              <span className="mr-2">{selectedModeInfo?.name || 'Select Mode'}</span>
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showDetailedSteps}
              onChange={onToggleDetailedSteps}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-800">Step-by-step solution</span>
          </label>
        </div>
      </div>

      {isOpen && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <ul className="py-1">
            {MATH_MODES.map((mode) => (
              <li
                key={mode.id}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                  selectedMode === mode.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleModeSelect(mode.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{mode.name}</span>
                  <span className="text-xs text-gray-600">{mode.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
