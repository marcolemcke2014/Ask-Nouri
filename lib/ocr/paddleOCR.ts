/**
 * PaddleOCR implementation for text extraction from images
 */

/**
 * Extract text from an image using PaddleOCR
 * @param base64Image Base64 encoded image (with or without data URL prefix)
 * @returns Extracted text from the image
 */
export async function runPaddleOCR(base64Image: string): Promise<string> {
  try {
    // Determine if we should use base64 or binary endpoint
    const isBase64WithPrefix = base64Image.startsWith('data:image');

    if (isBase64WithPrefix) {
      // Use base64 endpoint
      const response = await fetch("http://localhost:8000/ocr/base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("PaddleOCR API Error:", errorText);
        throw new Error(`PaddleOCR API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.text;
    } else {
      // For binary data, convert base64 to binary first
      const binaryString = atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Use binary endpoint
      const response = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("PaddleOCR API Error:", errorText);
        throw new Error(`PaddleOCR API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.text;
    }
  } catch (error) {
    console.error("Error calling PaddleOCR API:", error);
    throw new Error(`PaddleOCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from an image using PaddleOCR with fallback to OpenRouter's vision model
 * @param imageBuffer Raw image buffer
 * @returns Extracted text from the image
 */
export async function extractTextWithPaddleOCR(imageBuffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Send to PaddleOCR API
    const response = await fetch("http://localhost:8000/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: imageBuffer,
    });

    if (!response.ok) {
      throw new Error(`PaddleOCR API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn("PaddleOCR failed, using fallback:", error);
    
    // Fallback to OpenRouter API with vision model
    return fallbackToOpenRouterVision(imageBuffer);
  }
}

/**
 * Fallback to OpenRouter's vision model for OCR
 * @param imageBuffer Image buffer
 * @returns Extracted text
 */
async function fallbackToOpenRouterVision(imageBuffer: Buffer): Promise<string> {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-pro-vision",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all printed text from this menu image." },
              { type: "image_url", image_url: { url: "data:image/jpeg;base64," + imageBuffer.toString("base64") } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Error in OpenRouter fallback:", error);
    throw new Error(`Vision OCR fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 