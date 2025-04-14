# PaddleOCR Microservice

A lightweight API service that provides OCR capabilities using PaddleOCR.

## Features

- Extracts text from images using PaddleOCR
- Accepts both binary image uploads and base64-encoded images
- Cross-Origin Resource Sharing (CORS) enabled

## API Endpoints

- **GET /** - Health check endpoint
- **POST /ocr** - Process binary image and return extracted text
- **POST /ocr/base64** - Process base64-encoded image and return extracted text

## Running the Service

### Using Docker

```bash
# Build the Docker image
docker build -t paddle-ocr-api .

# Run the container
docker run -p 8000:8000 paddle-ocr-api
```

### Without Docker

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Usage Examples

### Sending a binary image:

```bash
curl -X POST "http://localhost:8000/ocr" \
  --header "Content-Type: application/octet-stream" \
  --data-binary "@/path/to/your/image.jpg"
```

### Sending a base64-encoded image:

```bash
curl -X POST "http://localhost:8000/ocr/base64" \
  --header "Content-Type: application/json" \
  --data '{"image": "base64_encoded_image_data"}'
``` 