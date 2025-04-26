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

# NutriFlow - Reorganized Structure

This document explains the organization of files in the NutriFlow application.

## Core Structure

- `pages/` - Next.js pages directory
  - `index.tsx` - Home/landing page (redirects to scan)
  - `dashboard.tsx` - Main dashboard after login
  - `_app.js` - Next.js App component

## Authentication Flow

- `pages/auth/` - Authentication pages
  - `login.tsx` - User login
  - `signup.tsx` - User registration 
  - `choose-plan.tsx` - Plan selection after signup
  - `payment-success.tsx` - Payment confirmation page

## Scan Feature

- `pages/scan/`
  - `index.tsx` - Main scan page with camera
  - `[id].tsx` - View a specific scan's result
  - `history/index.tsx` - View scan history

## Profile Management

- `pages/profile/`
  - `index.tsx` - User profile page
  - `settings.js` - User settings
  - Additional profile-related pages

## Results & Analysis

- `pages/results/`
  - `index.js` - Display scan results

## Components

- `components/` - Reusable UI components
  - `screens/` - Full screen components
    - `ScanScreen.tsx` - Camera screen for scanning
    - `ResultScreen.tsx` - Results display screen
    - `HomeScreen.tsx` - Home screen
  - `CameraScanner.tsx` - Camera component
  - `ui/` - UI elements
  - `layout/` - Layout components
  - `auth/` - Authentication components

## Duplicate/Unnecessary Files

The following files are duplicates or have been replaced by the new structure:

1. `pages/scan-history.tsx` - REPLACED BY `pages/scan/history/index.tsx`
2. `pages/scans.tsx` - DUPLICATE OF `pages/scan-history.tsx`
3. `pages/history.js` - OLDER VERSION WITH MOCK DATA
4. `pages/profile.tsx` - REPLACED BY `pages/profile/index.tsx`
5. `pages/settings.js` - REPLACED BY `pages/profile/settings.js`
6. `pages/results.js` - REPLACED BY `pages/results/index.js`
7. `pages/login.tsx` - REPLACED BY `pages/auth/login.tsx`
8. `pages/signup.tsx` - REPLACED BY `pages/auth/signup.tsx`
9. `pages/choose-plan.tsx` - REPLACED BY `pages/auth/choose-plan.tsx`
10. `pages/payment-success.tsx` - REPLACED BY `pages/auth/payment-success.tsx`

## Navigation Flow

1. User lands on `pages/index.tsx`
2. If logged in → redirect to `/scan`
3. If not logged in → show login page (`/auth/login`)
4. After signing up → select plan (`/auth/choose-plan`)
5. After payment → see confirmation (`/auth/payment-success`)
6. New user → start onboarding
7. Returning user → go to dashboard or scan page
8. Scan page uses `ScanScreen` component for camera functionality

## Recommendations

1. Use the new structure for all new development
2. When ready, delete the duplicate/unnecessary files listed above
3. Update any navigation links to point to the new file locations 