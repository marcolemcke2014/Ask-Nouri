# 📱 AI-Powered Menu Scanner App - Paquapp_v1

This is a mobile-first, installable web app that uses OCR and AI to help people find meals that match their health goals.

## Core Flow
Scan a menu → OCR extracts text → AI analyzes it → Results are personalized and saved

## Stack
- Next.js 14 + App Router
- Tailwind CSS (Mobile-first)
- Tesseract.js (WASM OCR)
- OpenAI / Claude API
- Supabase (Postgres, Auth, Edge)
- Hosted on Vercel or Replit

## Project Architecture
NutriFlow follows a "Russian doll" architecture where each feature lives in its own modular unit. 
If something breaks, only that piece should need fixing.

### Directory Structure
```
nutriflow/
├── app/                      # Next.js App Router (new)
│   ├── api/                  # API routes (App Router format)
│   │   ├── analyze/          # Menu analysis endpoints
│   │   ├── anthropic/        # Anthropic API integration
│   │   ├── hello/            # Test API endpoint
│   │   ├── openai/           # OpenAI API integration
│   │   ├── save-scan/        # Scan history saving
│   │   └── test-env/         # Environment variable testing
│   ├── page.jsx              # Root page (App Router)
│   └── layout.jsx            # Root layout (App Router)
│
├── pages/                    # Next.js Pages Router (legacy)
│   ├── api/                  # API routes (legacy)
│   ├── _app.js               # App component
│   ├── index.js              # Home page
│   ├── history.js            # Scan history page
│   ├── profile.js            # User profile page
│   ├── results.js            # Analysis results page
│   ├── settings.js           # User settings page
│   └── test-ocr.tsx          # OCR testing page
│
├── components/               # UI components
│   ├── layout/               # Layout components
│   ├── screens/              # Full page screen components
│   ├── ui/                   # Reusable UI components
│   └── CameraScanner.js      # Camera scanning component
│
├── contexts/                 # React contexts for state management
│
├── hooks/                    # Custom React hooks
│
├── lib/                      # Core logic and utilities
│   ├── agents/               # AI agent system
│   ├── ai/                   # AI-related logic
│   ├── db/                   # Database operations
│   ├── ocr/                  # OCR implementation
│   ├── utils/                # Utility functions
│   ├── ai.ts                 # AI integration
│   ├── env.ts                # Environment configuration
│   ├── ocr.ts                # OCR implementation
│   ├── parseMenu.ts          # Menu parsing logic
│   ├── prompts.ts            # AI prompt templates
│   └── videoHelpers.ts       # Video/camera utilities
│
├── public/                   # Static assets and PWA files
│
├── scripts/                  # Utility scripts
│
├── styles/                   # Global styles
│
├── types/                    # TypeScript type definitions
│
└── [Configuration Files]     # Various config files
```

### Migration Plan
We're gradually migrating from Pages Router to App Router:
1. New APIs are being created in app/api/
2. Existing pages are kept in pages/ for now
3. App Router is enabled while maintaining Pages Router
4. Eventually all pages will be migrated to the app/ directory

## Rules for Contributions
See `RULES_FOR_AI.md` for detailed contribution guidelines.

### Key Rules
- Each function/component has its own file
- Logic → `/lib`
- Types → `/types`
- UI → `/components`
- State logic → `/hooks` and `/contexts`
- API endpoints → `/app/api/` (new) or `/pages/api/` (legacy)
- TypeScript only — no `any`
- Mobile-first design
- API keys in environment variables only

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with required API keys
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment
The application is deployed on Vercel with continuous integration from GitHub.

# 🤖 RULES FOR AI CONTRIBUTORS

To all future AI and developers: Please follow these rules to evolve the app safely.

## 1. Modular Structure
- Each function/component has its own file
- No bloated pages or endpoints

## 2. File Placement
- Logic → `/lib`
- Types → `/types`
- UI → `/components`
- State logic → `/hooks`
- API endpoints → `/app/api/`

## 3. Feature Expansion
Adding a new feature?
- Add types → `/types/feature.ts`
- Add logic → `/lib/feature.ts`
- Add API → `/app/api/feature/route.ts`
- Add UI screen → `/components/screens/FeatureScreen.tsx`

## 4. Style Guide
- TypeScript only — no `any`
- CamelCase filenames in `/lib`, `/types`, `/hooks`
- PascalCase filenames in `/components`
- Always comment complex logic
- Use constants or enums instead of "magic strings"

## 5. Security
- API keys go in `.env.local`
- Never hardcode secrets
- Use `process.env.XYZ` consistently

## 6. Reusability
- If a logic block is reused 2+ times, extract it to `/lib`
- If a UI element is used in 2+ screens, move it to `/components/ui`

## 7. Cleanup
- Delete dead code
- Use descriptive function names
- Refactor when in doubt

## 8. Mobile-first Priority
- Always test on small screens
- Use Tailwind's mobile-first utilities (`sm:`, `md:`, `lg:`) 