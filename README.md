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

## Folder Philosophy
Russian doll modular system — every function or feature lives in its own file.
If something breaks, only that piece should need fixing.

## Structure
See `RULES_FOR_AI.md` for deeper details.

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