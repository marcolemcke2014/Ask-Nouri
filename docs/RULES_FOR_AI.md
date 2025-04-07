# NutriFlow Architecture Rules

This document provides detailed architecture guidelines for maintaining and expanding the NutriFlow application. Following these rules will ensure a clean, modular, future-proof codebase.

## Architectural Philosophy: Russian Doll System

NutriFlow follows a "Russian doll" architecture where:

1. Every feature lives in its own modular unit
2. Modules communicate through clean interfaces
3. Editing one part doesn't break others
4. The app organization is intuitive and predictable

## Directory Structure

```
nutriflow/
├── app/                      # Next.js app router
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── scan/             # OCR processing endpoints
│   │   ├── analyze/          # Menu analysis endpoints
│   │   └── ...               # Other API endpoints
│   ├── (routes)/             # Page routes
│   │   ├── page.tsx          # Home page
│   │   ├── scan/             # Scan screen route
│   │   ├── profile/          # User profile route
│   │   └── ...               # Other routes
│   └── layout.tsx            # Root layout
├── components/               # UI components
│   ├── layouts/              # Layout components
│   │   ├── MainLayout.tsx    # Main app layout
│   │   └── ...               # Other layouts
│   ├── screens/              # Full page screen components
│   │   ├── HomeScreen.tsx    # Home screen component
│   │   ├── ScanScreen.tsx    # Menu scanner screen
│   │   └── ...               # Other screens
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.tsx        # Button component
│   │   ├── Card.tsx          # Card component
│   │   └── ...               # Other UI elements
│   ├── scanner/              # Scanner-specific components
│   │   ├── ScanBox.tsx       # Scanner viewfinder
│   │   └── ...               # Other scanner components
│   └── ...                   # Other component categories
├── hooks/                    # React hooks
│   ├── useOCR.ts             # OCR functionality hook
│   ├── useMenuAnalysis.ts    # Menu analysis hook
│   └── ...                   # Other hooks
├── lib/                      # Core logic and utilities
│   ├── ai/                   # AI-related logic
│   │   ├── menuAnalysis.ts   # Menu analysis logic
│   │   ├── prompts.ts        # AI prompt templates
│   │   └── ...               # Other AI functions
│   ├── ocr/                  # OCR-related logic
│   │   ├── scanner.ts        # Image scanning logic
│   │   ├── imageProcessing.ts # Image preprocessing
│   │   └── ...               # Other OCR functions
│   ├── db/                   # Database-related logic
│   │   ├── client.ts         # Database client
│   │   ├── user.ts           # User data operations
│   │   └── ...               # Other DB functions
│   └── utils/                # Utility functions
│       ├── formatting.ts     # Text formatting utilities
│       └── ...               # Other utilities
├── types/                    # TypeScript type definitions
│   ├── ai.ts                 # AI-related types
│   ├── menu.ts               # Menu and food-related types
│   ├── user.ts               # User-related types
│   └── ...                   # Other type definitions
├── styles/                   # Global styles
│   ├── globals.css           # Global CSS
│   └── ...                   # Other stylesheets
├── public/                   # Static assets
│   ├── pwa/                  # PWA assets (icons, manifest)
│   └── ...                   # Other public assets
└── next.config.js            # Next.js configuration
```

## Detailed Rules

### 1. File Organization

- **One concern per file**: Each file should handle exactly one logical concern
- **Predictable imports**: Files that work together should be near each other
- **Domain separation**: Group files by domain (auth, scan, analyze) not technology
- **Shallow imports**: Avoid deep nesting (prefer `@/lib/ai` over `../../../../lib/ai`)

### 2. Component Architecture

- **Presentational/Container pattern**: Separate UI from business logic
- **Composition over inheritance**: Build complex components by composing simple ones
- **Props drilling limit**: Max 2 levels, then use context or state management
- **Mobile-first**: Design components for mobile first, then enhance for larger screens

### 3. State Management

- **Local state**: Use React's `useState` for component-specific state
- **Shared state**: Use React Context for state shared between components
- **Complex state**: Use custom hooks to encapsulate complex state logic
- **Form state**: Use controlled components for form inputs

### 4. API Design

- **RESTful principles**: Follow RESTful API design patterns
- **Error handling**: Consistent error responses with descriptive messages
- **Validation**: Validate all inputs on both client and server
- **Versioning**: Prepare for API versioning with `/api/v1/` structure

### 5. Type Safety

- **No `any` types**: Avoid using `any` type, use proper type definitions
- **Type over interface**: Use `type` for most cases, `interface` only when extending
- **Enum over strings**: Use enums for finite sets of options
- **Strict null checks**: Enable strict null checks in TypeScript

### 6. AI Integration

- **Prompt templates**: Store AI prompts in separate files with clear documentation
- **Fallback logic**: Always have fallback logic if AI services fail
- **Rate limiting**: Implement rate limiting for AI API calls
- **Response validation**: Validate AI responses against expected schema

### 7. Performance Optimization

- **Code splitting**: Use dynamic imports for code splitting
- **Image optimization**: Use Next.js Image component for optimized images
- **Lazy loading**: Lazy load components not needed on initial render
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations

### 8. Security Best Practices

- **Input sanitization**: Sanitize all user inputs
- **Auth guards**: Implement proper authentication and authorization checks
- **Environment variables**: Store all secrets in environment variables
- **Content security**: Implement proper Content Security Policy

### 9. Testing Strategy

- **Component tests**: Write tests for UI components
- **Unit tests**: Write tests for utility functions and core logic
- **Integration tests**: Test API endpoints and data flow
- **E2E tests**: Use Cypress or similar for end-to-end testing

### 10. Documentation

- **Component docs**: Document props, state, and side effects for components
- **Function docs**: Document parameters, return values, and exceptions
- **API docs**: Document endpoints, request/response schemas
- **Type docs**: Document complex types and their usage 