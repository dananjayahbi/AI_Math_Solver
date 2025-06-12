import { useState } from 'react';
import axios from 'axios';
import { GeneratedResult, Point, SelectionBounds, MathResult } from '../types/math/types';

/**
 * Custom hook for API integration
 */
export const useApiIntegration = () => {  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [dictOfVars, setDictOfVars] = useState<Record<string, MathResult>>({});

  // Function to handle API calls
  const processMathApi = async (
    canvas: HTMLCanvasElement,
    selectionMode: boolean,
    selectionActive: boolean,
    selectionBounds: SelectionBounds | null,
    selectionCenter: Point | null,
    selectionPath: Point[],
    mathMode: string,
    isPointInPath: (point: Point, path: Point[]) => boolean
  ) => {
    if (canvas && (!selectionMode || (selectionMode && selectionActive))) {
      try {
        setLoading(true);
        
        // Handle selected area or entire canvas
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

        // Process either selection or entire canvas
        if (!selectionMode) {
          // Use the entire canvas
          imageData = canvas.toDataURL('image/png');
        } else if (selectionActive) {
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
            
            // Get the data URL from the canvas
            imageData = tempCanvas.toDataURL('image/png');
          }
        }

        // If image data was successfully created
        if (imageData) {
          console.log('Sending image to API for processing in mode:', mathMode);
          
          // Make API call to math recognition endpoint
          const resp = await axios.post('/api/math', {
            image_base64: imageData,
            coordinates: {
              x: centerPoint.x,
              y: centerPoint.y
            },
            mode: mathMode
          });
          
          console.log('API Response:', resp.data);
          console.log('Bounds:', boundingRect);
          
          // Use the center point directly - it's already correct for positioning
          const newPosition = {
            x: centerPoint.x,
            y: centerPoint.y 
          };
          
          console.log('Setting LaTeX position to:', newPosition);
          
          // Only process the first answer to avoid duplicates
          if (resp.data && resp.data.length > 0) {
            const firstResult = resp.data[0];
            
            // Create proper result object
            const generatedResult: GeneratedResult = {
              expression: firstResult.expr,
              answer: firstResult.result,
              steps: firstResult.steps,
              formulas_used: firstResult.formulas_used
            };
            
            // Update variables dictionary if we're assigning a value
            if (firstResult.assign) {
              const newVars = { ...dictOfVars };
              // Extract variable name as the first token of the expression
              const varMatch = firstResult.expr.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*=/);
              if (varMatch && varMatch[1]) {
                const varName = varMatch[1];
                newVars[varName] = firstResult.result;
                setDictOfVars(newVars);
              }
            }
            
            // Save result for rendering
            setResult(generatedResult);
            
            return { 
              position: newPosition, 
              result: generatedResult
            };
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in API call:', error);
        return null;
      } finally {
        setLoading(false);
      }
    }
    
    return null;
  };

  return {
    loading,
    result,
    dictOfVars,
    setResult,
    setDictOfVars,
    processMathApi
  };
};
