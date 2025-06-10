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
