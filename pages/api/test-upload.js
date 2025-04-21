import busboy from 'busboy';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Test API endpoint for file uploads using busboy instead of formidable
 * for better compatibility with Vercel serverless environment
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  console.log("📥 Received test upload request");
  
  try {
    // Parse the form data using busboy
    const data = await parseFormData(req);
    const { fields, files } = data;
    
    console.log("Received fields:", Object.keys(fields));
    console.log("Received files:", Object.keys(files));
    
    if (files.image) {
      const imageFile = files.image;
      console.log(`Received image: ${imageFile.name || 'unknown'}, size: ${imageFile.size} bytes`);
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

/**
 * Parse the multipart form data using busboy
 */
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    // Initialize result object
    const result = {
      fields: {},
      files: {}
    };
    
    // Create busboy instance
    const bb = busboy({ headers: req.headers });
    
    // Handle file fields
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      
      file.on('data', (data) => {
        chunks.push(data);
      });
      
      file.on('end', () => {
        result.files[name] = {
          name: filename,
          mimeType: mimeType,
          encoding: encoding,
          data: Buffer.concat(chunks),
          size: Buffer.concat(chunks).length
        };
      });
    });
    
    // Handle regular fields
    bb.on('field', (name, val) => {
      result.fields[name] = val;
    });
    
    // Handle parsing completion
    bb.on('close', () => {
      resolve(result);
    });
    
    // Handle error
    bb.on('error', (err) => {
      reject(err);
    });
    
    // Pipe the request to busboy
    req.pipe(bb);
  });
} 