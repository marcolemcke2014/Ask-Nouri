# NutriFlow Environment Configuration

This document explains how to set up environment variables for local development and production deployment of NutriFlow.

## Required Environment Variables

NutriFlow requires the following environment variables to function properly:

- `OPENAI_API_KEY`: Your OpenAI API key for menu analysis
- `GOOGLE_VISION_KEY`: Your Google Vision API key for OCR text recognition
- `ANTHROPIC_API_KEY`: Your Anthropic API key for alternative AI provider

## Local Development Setup

1. Copy the example environment file to create a local configuration:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your actual API keys:
   ```
   OPENAI_API_KEY=sk-your-real-openai-key
   GOOGLE_VISION_KEY=your-real-google-vision-key
   ANTHROPIC_API_KEY=sk-ant-your-real-anthropic-key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Test your environment configuration by visiting:
   ```
   http://localhost:3000/api/test-env
   ```
   
   For detailed validation including API key testing, use:
   ```
   http://localhost:3000/api/test-env?validate=true
   ```

## Production Deployment with Vercel

When deploying to Vercel:

1. Add the environment variables in the Vercel dashboard:
   - Project Settings > Environment Variables
   - Add each required variable and its corresponding value
   
2. Ensure that all environment variables are set to be available in "Production" and "Preview" environments as needed.

3. After deployment, verify your environment configuration by visiting:
   ```
   https://your-app-url.vercel.app/api/test-env
   ```

## Troubleshooting

If you encounter issues:

1. Check the response from `/api/test-env` to see which variables are missing or invalid
2. Verify that your API keys have the correct permissions
3. Make sure your API keys are active and not expired
4. Restart the development server after changing environment variables

## Security Notes

- Never commit `.env.local` or any file containing actual API keys to version control
- Always use environment variables for API keys, never hardcode them
- On Vercel, API keys are securely encrypted and only decrypted at runtime 