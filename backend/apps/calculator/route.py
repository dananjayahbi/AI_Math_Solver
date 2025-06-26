from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    image_data = base64.b64decode(data.image.split(",")[1])  # Assumes data:image/png;base64,<data>
    image_bytes = BytesIO(image_data)
    image = Image.open(image_bytes)
    
    # Log image information for debugging
    print(f"Received image: {image.format}, {image.size}, {image.mode}")
    
    # Check if the image is mostly blank or has content
    has_content = False
    if image.mode == 'RGBA':
        # Convert to RGB for simpler processing
        image = image.convert('RGB')
    
    # Count non-white pixels to see if we have content (simple check)
    pixels = image.load()
    width, height = image.size
    non_white_count = 0
    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            # If not white (allowing some tolerance)
            if any(channel < 240 for channel in pixel):
                non_white_count += 1
    
    print(f"Image analysis: {non_white_count} non-white pixels out of {width*height} total pixels")
    has_content = non_white_count > (width * height * 0.01)  # At least 1% non-white
    
    if not has_content:
        print("Warning: Image appears to be mostly blank")
    
    # Pass mode and detailed_steps parameters from request
    responses = analyze_image(
        image, 
        dict_of_vars=data.dict_of_vars,
        mode=data.mode,
        detailed_steps=data.detailed_steps
    )
    
    result_data = []
    for response in responses:
        result_data.append(response)
    
    print('response in route: ', responses)
    return {
        "message": f"Image processed in {data.mode} mode", 
        "data": result_data, 
        "status": "success"
    }
