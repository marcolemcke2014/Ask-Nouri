from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import base64
import io
from PIL import Image
import numpy as np
from paddleocr import PaddleOCR
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

app = FastAPI(title="PaddleOCR API")

# Add CORS middleware to allow requests from the Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR with English language and GPU acceleration if available
ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

@app.get("/")
async def root():
    return {"status": "ok", "message": "PaddleOCR API is running"}

@app.post("/ocr")
async def extract_text(request: Request):
    try:
        # Get request body as bytes
        body = await request.body()
        
        # Check if the body is empty
        if not body:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Log request size
        logging.info(f"Received image of size: {len(body)} bytes")
        start_time = time.time()
        
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(body))
            
            # Convert PIL Image to numpy array for PaddleOCR
            img_array = np.array(image)
            
            # Run OCR
            result = ocr.ocr(img_array, cls=True)
            
            # Extract text from OCR results
            full_text = ""
            
            # PaddleOCR returns a list of lists, each containing recognition results for one image
            if result and isinstance(result, list):
                # For each line
                for idx, line in enumerate(result[0] if result[0] is not None else []):
                    # Each line has a text and confidence value
                    if len(line) >= 2 and isinstance(line[1], tuple) and len(line[1]) >= 1:
                        text, confidence = line[1]
                        full_text += text + "\n"
            
            # Calculate processing time
            processing_time = time.time() - start_time
            logging.info(f"OCR completed in {processing_time:.2f} seconds")
            
            # Return the extracted text
            return {"text": full_text.strip(), "processing_time_seconds": processing_time}
        
        except Exception as e:
            logging.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
    except Exception as e:
        logging.error(f"Error in OCR endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/ocr/base64")
async def extract_text_base64(image_data: dict):
    try:
        # Get base64 image from request
        base64_image = image_data.get("image", "")
        
        if not base64_image:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Remove data URL prefix if present
        if base64_image.startswith('data:image'):
            base64_image = base64_image.split(',')[1]
        
        # Log request size
        logging.info(f"Received base64 image of size: {len(base64_image)} characters")
        start_time = time.time()
        
        try:
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_image)
            
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert PIL Image to numpy array for PaddleOCR
            img_array = np.array(image)
            
            # Run OCR
            result = ocr.ocr(img_array, cls=True)
            
            # Extract text from OCR results
            full_text = ""
            
            # PaddleOCR returns a list of lists, each containing recognition results for one image
            if result and isinstance(result, list):
                # For each line
                for idx, line in enumerate(result[0] if result[0] is not None else []):
                    # Each line has a text and confidence value
                    if len(line) >= 2 and isinstance(line[1], tuple) and len(line[1]) >= 1:
                        text, confidence = line[1]
                        full_text += text + "\n"
            
            # Calculate processing time
            processing_time = time.time() - start_time
            logging.info(f"OCR completed in {processing_time:.2f} seconds")
            
            # Return the extracted text
            return {"text": full_text.strip(), "processing_time_seconds": processing_time}
        
        except Exception as e:
            logging.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
    except Exception as e:
        logging.error(f"Error in OCR endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 