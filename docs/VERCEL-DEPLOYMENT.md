# NutriFlow Vercel Deployment Guide

This document provides step-by-step instructions for deploying NutriFlow to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with the NutriFlow repository
2. A Vercel account (you can create one at [vercel.com](https://vercel.com))
3. API keys for:
   - OpenAI
   - Google Cloud Vision
   - Anthropic

## Deployment Steps

### 1. Connect to GitHub Repository

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Select the GitHub repository containing NutriFlow
4. Click "Import"

### 2. Configure Project Settings

1. Configure the project name (or use the default)
2. Select the appropriate framework preset (Next.js should be auto-detected)
3. Leave build and output settings at their default values

### 3. Add Environment Variables

1. Expand the "Environment Variables" section
2. Add each of the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview |
   | `GOOGLE_VISION_KEY` | Your Google Vision API key | Production, Preview |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key | Production, Preview |

4. Click "Deploy"

### 4. Verify Deployment

1. Wait for the deployment to complete
2. Visit your deployed application
3. Test the environment variables by visiting `/api/test-env` endpoint
4. Optionally, run a more thorough test with `/api/test-env?validate=true`

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs for errors
2. Verify that all environment variables are correctly set
3. Ensure the API keys have the necessary permissions and are active
4. Try re-deploying after fixing any issues

## Updating the Deployment

Any new pushes to the main branch will automatically trigger a new deployment. If you need to update environment variables:

1. Go to the Vercel dashboard
2. Select your NutriFlow project
3. Go to Settings → Environment Variables
4. Update as needed

## Custom Domains

To use a custom domain:

1. Go to the Vercel dashboard
2. Select your NutriFlow project
3. Go to Settings → Domains
4. Follow the instructions to add and verify your domain 