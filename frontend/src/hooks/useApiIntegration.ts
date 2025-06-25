import { useState } from 'react';
import axios from 'axios';
import { GeneratedResult, Point, SelectionBounds, MathResult, MathApiResponse } from '../types/math/types';

/**
 * Custom hook for API integration
 */
export const useApiIntegration = () => {
  const [loading, setLoading] = useState(false);
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
    // Only process if there's an active selection
    if (canvas && selectionActive) {
      try {
        setLoading(true);
        
        let imageData: string;
        
        // Process the selected area
        if (selectionBounds && selectionCenter && selectionPath.length > 2) {          // Create a temporary canvas for the selected area
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          // Use the free-form selection bounds
          const boundingRect = selectionBounds;
          
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
          
          // Use the masked temp canvas for the API call
          imageData = tempCanvas.toDataURL('image/png');
          
          // Send the API request
          const response = await axios({
            method: 'post',
            url: `${import.meta.env.VITE_API_URL}/calculate`,
            data: {
              image: imageData,
              dict_of_vars: dictOfVars,
              mode: mathMode,
              detailed_steps: true
            }
          });

          const resp = await response.data;
          console.log('API Response:', resp);
            // Update variables dictionary if there are assignments
          if (resp.data && resp.data.length > 0) {
            resp.data.forEach((data: MathApiResponse) => {
              if (data.assign === true) {
                setDictOfVars(prev => ({
                  ...prev,
                  [data.expr]: data.result
                }));
              }
            });
            
            // Process the first answer to avoid duplicates
            if (resp.data.length > 0) {
              const data = resp.data[0];
              
              // Generate result object
              const generatedResult: GeneratedResult = {
                expression: data.expr,
                answer: data.result,
                steps: data.steps,
                formulas_used: data.formulas_used
              };
              
              setResult(generatedResult);
            }
          }
        } else {
          console.error("Invalid selection bounds or path");
          alert("Please make a valid selection around an equation");
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in API call:', error);
      } finally {
        setLoading(false);
      }
    } else {
      console.error("Selection required");
      alert("Please select an equation first");
      setLoading(false);
    }
  };

  return {
    loading,
    result,
    processMathApi,
    setResult,
    dictOfVars,
    setDictOfVars
  };
};
