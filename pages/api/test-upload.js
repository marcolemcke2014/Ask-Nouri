import formidable from 'formidable';
import { promises as fs } from 'fs';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Test API endpoint for file uploads
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  console.log("📥 Received test upload request");
  
  try {
    // Parse the form data
    const data = await parseForm(req);
    const { fields, files } = data;
    
    console.log("Received fields:", Object.keys(fields));
    console.log("Received files:", Object.keys(files));
    
    if (files.image) {
      const imageFile = files.image;
      console.log(`Received image: ${imageFile.originalFilename || 'unknown'}, size: ${imageFile.size} bytes`);
    } else {
      console.log("No image field found in request");
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Form data received',
      fields: Object.keys(fields),
      files: Object.keys(files)
    });
  } catch (error) {
    console.error("Error handling form:", error);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Helper function to parse form data
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
} 