import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("📥 Received test upload request");
    console.log("Content-Type:", request.headers.get("Content-Type"));
    
    try {
      const formData = await request.formData();
      console.log("FormData keys:", Array.from(formData.keys()));
      
      for (const key of Array.from(formData.keys())) {
        const value = formData.get(key);
        console.log(`Key: ${key}, Type: ${typeof value}, Is Blob: ${value instanceof Blob}`);
        
        if (value instanceof Blob) {
          console.log(`Blob size: ${value.size} bytes, type: ${value.type}`);
        }
      }
      
      return NextResponse.json({
        status: 'success',
        message: 'Form data received and logged'
      });
    } catch (error) {
      console.error("Error processing form data:", error);
      return NextResponse.json(
        { error: 'Failed to process form data' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Outer error:", error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 