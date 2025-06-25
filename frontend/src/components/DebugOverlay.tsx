import { useState, useEffect } from 'react';

interface DebugOverlayProps {
  selectionMode: boolean;
}

export function DebugOverlay({ selectionMode }: DebugOverlayProps) {
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [clickCount, setClickCount] = useState<number>(0);
  const [lastEvent, setLastEvent] = useState<string>('None');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setClickCount(prev => prev + 1);
      setLastEvent('MouseDown');
    };

    const handleMouseUp = () => {
      setLastEvent('MouseUp');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 p-3 rounded shadow-lg z-50 text-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>Selection Mode: <span className={selectionMode ? "text-green-500 font-bold" : "text-red-500"}>{selectionMode ? "ON" : "OFF"}</span></div>
      <div>Mouse Position: x: {mousePos.x}, y: {mousePos.y}</div>
      <div>Click Count: {clickCount}</div>
      <div>Last Event: {lastEvent}</div>
    </div>
  );
}
