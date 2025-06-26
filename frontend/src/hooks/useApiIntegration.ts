import { useState } from 'react';
import axios from 'axios';
import { GeneratedResult, Point, SelectionBounds, MathResult, MathApiResponse } from '../types/math/types';

/**
 * Custom hook for API integration
 */
export const useApiIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [dictOfVars, setDictOfVars] = useState<Record<string, MathResult>>({});  // Function to handle API calls
  const processMathApi = async (
    canvas: HTMLCanvasElement,
    _selectionMode: boolean, // Prefix with underscore to indicate it's not used
    selectionActive: boolean,
    selectionBounds: SelectionBounds | null,
    selectionCenter: Point | null,
    selectionPath: Point[],
    mathMode: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isPointInPath: (point: Point, path: Point[]) => boolean
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
          tempCanvas.height = height;          // Create a masked version of the selection area using pixel-level masking
          tempCtx!.save();
          
          // Fill temp canvas with white background first (important for good OCR)
          tempCtx!.fillStyle = 'white';
          tempCtx!.fillRect(0, 0, width, height);
          
          // Then draw the original image to the temp canvas
          tempCtx!.drawImage(
            canvas,
            boundingRect.minX, boundingRect.minY, width, height,
            0, 0, width, height
          );
          
          // Log selection dimensions to help debug
          console.log('Selection dimensions:', {
            width,
            height,
            selectionBounds,
            boundingRect,
            originalWidth: canvas.width,
            originalHeight: canvas.height
          });
            // Modified approach: Keep all pixels within the selection path, don't mask them
          // This should fix the blank image issue by ensuring pixels are preserved
          
          // For now, don't perform pixel-level masking, just use the selection as-is
          // This ensures we're sending a non-blank image for testing
          // After testing and confirming it works, we can refine the masking approach
          
          // Add a more visible black border to the selection to help OCR distinguish math content
          tempCtx!.strokeStyle = '#000000';
          tempCtx!.lineWidth = 2;
          tempCtx!.strokeRect(0, 0, width, height);
          
          // Add a border for visibility (helps with OCR)
          tempCtx!.strokeStyle = '#000000';
          tempCtx!.lineWidth = 1;
          tempCtx!.strokeRect(0, 0, width, height);
          
          // Debug: Log the dimensions of the selected area
          console.log('Selection dimensions:', { width, height });
          
          // Use the masked temp canvas for the API call
          imageData = tempCanvas.toDataURL('image/png');
          
          // Send the API request          // Enhanced debugging for image data
          console.log('Sending image data (preview):', imageData.substring(0, 100) + '...');
          console.log('Image data length:', imageData.length);
          
          // Debug: Check if we're getting a valid image
          const img = new Image();
          img.onload = () => {
            console.log('Image loaded successfully with dimensions:', img.width, 'x', img.height);
            
            // Additional validation for image content
            const debugCanvas = document.createElement('canvas');
            const debugCtx = debugCanvas.getContext('2d');
            debugCanvas.width = img.width;
            debugCanvas.height = img.height;
            
            if (debugCtx) {
              // Draw the image
              debugCtx.drawImage(img, 0, 0);
                // Check if the image has any non-white pixels
              const imgData = debugCtx.getImageData(0, 0, debugCanvas.width, debugCanvas.height);
              const data = imgData.data;
              
              let nonWhitePixels = 0;
              const totalPixels = data.length / 4;
              
              for (let i = 0; i < data.length; i += 4) {
                // If this is not a pure white pixel (allowing some tolerance)
                if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
                  nonWhitePixels++;
                }
              }
              
              console.log(`Image content analysis: ${nonWhitePixels} non-white pixels out of ${totalPixels} total pixels (${(nonWhitePixels/totalPixels*100).toFixed(2)}%)`);
            }
          };
          img.onerror = () => {
            console.error('Failed to load image from data URL');
          };
          img.src = imageData;
          
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
