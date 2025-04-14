import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromBuffer } from '@/lib/ocr';
import { OCRParser } from '@/lib/agents/ocr_parser/agent';
import { OCRResult } from '@/types/ocr';
import { supabase } from '@/lib/supabase';

/**
 * Type for the save scan request body
 */
interface SaveScanRequest {
  rawText: string;
  cleanedText?: string;
  items: Array<{
    name: string;
    score: number;
    tags: string[];
    flags: string[];
    improvements: string[];
  }>;
  restaurantName?: string;
  imageDataUrl?: string;
  userId?: string;
  userGoals?: string[];
}

/**
 * API endpoint to save OCR scan results and AI analysis
 * 
 * @param request The incoming request with scan data
 * @returns Confirmation with the saved scan ID
 */
export async function POST(request: Request) {
  try {
    console.log("📥 Received image upload request");
    
    // Debug request content type
    console.log("Content-Type:", request.headers.get("Content-Type"));
    
    // Get the image data from the request
    try {
      const formData = await request.formData();
      console.log("FormData keys:", Array.from(formData.keys()));
      
      const image = formData.get('image');
      if (!image) {
        console.error("No image field found in form data");
        return NextResponse.json(
          { error: 'Image field is required in form data' },
          { status: 400 }
        );
      }
      
      console.log("Image field type:", typeof image, image instanceof Blob ? "Blob" : "Not a Blob");
      
      // Extract buffer from the image blob
      const imageBuffer = Buffer.from(await (image as Blob).arrayBuffer());
      
      if (!imageBuffer || imageBuffer.length === 0) {
        return NextResponse.json(
          { error: 'Image data is empty' },
          { status: 400 }
        );
      }
      
      console.log(`Processing image of size: ${imageBuffer.length} bytes`);
    
      // Try to extract text using PaddleOCR service
      let extractedText = '';
      try {
        // Create form data with the image
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('image', blob);
        
        console.log("🧠 Sending image to PaddleOCR...");
        // Send to PaddleOCR service
        const ocrResponse = await fetch('http://localhost:8000/ocr', {
          method: 'POST',
          body: formData
        });
        
        if (!ocrResponse.ok) {
          throw new Error(`PaddleOCR service returned ${ocrResponse.status}`);
        }
        
        const ocrResult = await ocrResponse.json();
        extractedText = ocrResult.text || '';
        console.log(`✅ PaddleOCR text extracted. Characters: ${extractedText.length}`);
        
      } catch (ocrError) {
        console.warn("⚠️ PaddleOCR failed. Falling back to OpenRouter...", ocrError);
        
        try {
          // Convert image to base64 for OpenRouter
          const base64Image = imageBuffer.toString('base64');
          
          console.log("💬 Asking OpenRouter to extract text from image...");
          // Call OpenRouter as fallback
          const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
          if (!OPENROUTER_API_KEY) {
            throw new Error('Missing OpenRouter API key');
          }
          
          const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://nutriflow.vercel.app",
              "X-Title": "NutriFlow",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You're a professional OCR system. Extract only the raw text from a photo of a printed restaurant menu.",
                },
                {
                  role: "user",
                  content: `Here is the base64 image: ${base64Image}`,
                },
              ],
            }),
          });
          
          if (!aiResponse.ok) {
            throw new Error(`OpenRouter returned ${aiResponse.status}`);
          }
          
          const aiResult = await aiResponse.json();
          extractedText = aiResult.choices[0]?.message?.content || '';
          console.log(`✅ OpenRouter returned OCR text. Characters: ${extractedText.length}`);
        } catch (aiError) {
          console.error("❌ OpenRouter fallback failed:", aiError instanceof Error ? aiError.message : 'Unknown error');
          extractedText = 'OCR extraction failed';
        }
      }
      
      // Generate a unique ID for this scan
      const scanId = uuidv4();
      
      console.log("📦 Inserting OCR result into Supabase...");
      // Insert real OCR data into Supabase
      const { data, error } = await supabase
        .from('menu_scan')
        .insert({
          id: scanId,
          user_id: 'test-user',
          menu_raw_text: extractedText,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to save scan data to database' },
          { status: 500 }
        );
      }
      
      console.log(`✅ Supabase insert successful. ID: ${scanId}`);
      
      // Return success response with the Supabase insert ID
      console.log("🎉 OCR flow complete. Returning response.");
      return NextResponse.json({
        status: 'success',
        supabaseInsertId: data.id
      });
      
    } catch (error) {
      console.error('Error in save scan endpoint:', error);
      
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in save scan endpoint:', error);
    
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
} 