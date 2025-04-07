import { NextResponse } from 'next/server';

// In a real app, this would connect to a database
const scanHistory = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, scanData, analysisResults } = body;
    
    if (!scanData) {
      return NextResponse.json({ error: 'Scan data is required' }, { status: 400 });
    }
    
    // Generate a scan ID and timestamp
    const scanId = `scan_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Create the scan record
    const scanRecord = {
      id: scanId,
      userId: userId || 'anonymous',
      timestamp,
      scanData,
      analysisResults
    };
    
    // Save to in-memory history (in real app, save to database)
    scanHistory.push(scanRecord);
    
    // In production, we would save to a real database here
    
    return NextResponse.json({
      success: true,
      scanId,
      message: 'Scan saved successfully'
    });
  } catch (error) {
    console.error('Error saving scan:', error);
    return NextResponse.json({ error: error.message || 'Failed to save scan' }, { status: 500 });
  }
} 