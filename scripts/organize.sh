#!/bin/bash
# Project Structure Organization Script for NutriFlow
# This script ensures project files are organized according to the project architecture

echo "🚀 Organizing NutriFlow project structure..."

# Create directories if they don't exist
mkdir -p config docs

# Update config directory
echo "📁 Syncing configuration files..."
cp next.config.js config/ 2>/dev/null || echo "⚠️  next.config.js not found"
cp tailwind.config.js config/ 2>/dev/null || echo "⚠️  tailwind.config.js not found"
cp postcss.config.js config/ 2>/dev/null || echo "⚠️  postcss.config.js not found"
cp tsconfig.json config/ 2>/dev/null || echo "⚠️  tsconfig.json not found"
cp vercel.json config/ 2>/dev/null || echo "⚠️  vercel.json not found"

# Update docs directory
echo "📄 Syncing documentation files..."
cp VERCEL-DEPLOYMENT.md docs/ 2>/dev/null || echo "⚠️  VERCEL-DEPLOYMENT.md not found"
cp RULES_FOR_AI.md docs/ 2>/dev/null || echo "⚠️  RULES_FOR_AI.md not found"
cp CONTRIBUTING.md docs/ 2>/dev/null || echo "⚠️  CONTRIBUTING.md not found"

# Create other directories if they don't exist
mkdir -p app/api lib/ai lib/ocr lib/utils components/ui components/layout components/screens contexts hooks styles types

echo "✅ Project structure organization complete!"
echo "Note: Root configuration files preserved for compatibility." 