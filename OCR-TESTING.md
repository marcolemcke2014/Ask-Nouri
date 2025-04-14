# OCR Testing Guide

This document explains how to test the OCR implementation in the NutriFlow application using Gemini 1.5 Flash and Yi-Vision models from OpenRouter.

## No Fake Data Policy

**Important**: Our application follows a strict policy:
- We NEVER return or store simulated/fake menu content
- OCR failures return proper error messages, not fake data
- Only real OCR results from vision models are stored in the database
- If both models fail, the user will see an error message

## Prerequisites

1. Make sure you have an OpenRouter API key set in your `.env.local` file:
   ```
   OPENROUTER_API_KEY=sk-ro-your-openrouter-key
   ```

2. Ensure you have Node.js installed on your system.

## Testing Methods

### Option 1: Using the Test Script

We've provided a testing script that compares both models side by side:

1. Place a test menu image in the `test-results/test-menu.jpg` path:
   ```sh
   mkdir -p test-results
   # Copy a menu image to test-results/test-menu.jpg
   ```

2. Run the test script:
   ```sh
   node scripts/test-vision-models.js
   ```

3. Check the results:
   - The script will save the OCR results from each model as text files in the `test-results` directory
   - Compare `google-gemini-1.5-flash-result.txt` and `01-ai-yi-vision-result.txt`

### Option 2: Testing in the Application

1. Run the development server:
   ```sh
   npm run dev
   ```

2. Open the application in your browser at `http://localhost:3000`

3. Use the scan function to scan a menu image

4. Check the console logs for detailed OCR processing information:
   - Look for log entries with `OCR` tag
   - The logs will show which model was used (primary or secondary)
   - You'll see the extracted text sample or error information

### Option 3: Testing Failure Scenarios

It's important to test the error handling when OCR fails:

1. Try scanning an image without text or with unclear text
2. Verify that proper error messages are shown to the user
3. Check the logs to ensure no fake data is generated
4. Confirm no database entries are created for failed OCR attempts

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Make sure your OpenRouter API key is valid and has access to vision models
   - Check that the API key is correctly set in `.env.local`

2. **Image Format Problems**
   - Use JPEG or PNG images for best results
   - Ensure the image is clear and well-lit
   - Text should be readable and not blurry

3. **Model Availability**
   - If Gemini 1.5 Flash is unavailable, the system will automatically try Yi-Vision
   - If both models fail, a proper error will be returned
   - Check the application logs to see which model was used

### Viewing Logs

To view detailed logs of the OCR process:

1. In development:
   - Check the terminal where you're running `npm run dev`
   - Look for log entries with the `OCR` tag

2. In production:
   - Check your Vercel logs or other deployment platform logs
   - Filter for entries containing "OCR" to see the OCR-specific logs 