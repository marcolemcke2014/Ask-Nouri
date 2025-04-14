// Simple test endpoint to verify file upload functionality
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Log that we received a request
    console.log('Received test file request');
    console.log('Content-Type:', req.headers['content-type']);
    
    // Just return success for testing
    return res.status(200).json({ 
      status: 'success',
      message: 'Test endpoint working'
    });
  } else {
    // GET request - just return a success message
    return res.status(200).json({ 
      status: 'ready',
      message: 'Test file upload endpoint is ready' 
    });
  }
} 