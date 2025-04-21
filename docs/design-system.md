# Forkcast Design System

This design system document outlines the core visual elements, component styles, and usage guidelines for the Forkcast application. Based on the login page design, this system ensures consistency across all user interfaces.

## 1. Typography

### Font Family
- Primary Font: **Poppins** (Google Fonts)
- Weights used: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)

### Font Sizes and Styles
- Headings: 
  - Primary: `text-xl sm:text-2xl font-light` (Welcome messages, page titles)
  - Secondary: `text-lg font-normal` (Section headings)
- Body:
  - Default: `text-sm font-normal` (Regular content, button text)
  - Small: `text-xs` (Labels, helper text, links)

### Implementation
```tsx
// Font imports in _app.tsx or layout component
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />

// In tailwind.config.js
fontFamily: {
  sans: ['Poppins', 'sans-serif'],
},
```

## 2. Color Palette

### Brand Colors
- Primary Green: `#34A853` (Buttons, active elements)
- Dark Green Gradient: 
  - From: `#14532D`
  - To: `#0A4923`
- Highlight Green: `#84F7AC` (Links, accents, success text)

### UI Colors
- Background: 
  - Main: Green gradient `from-[#14532D] to-[#0A4923]`
  - Card/Container: `bg-off-white/20` (translucent white with 20% opacity)
  - Input fields: `bg-off-white/80` (translucent white with 80% opacity)
- Text:
  - Light: `text-off-white` (Text on dark backgrounds)
  - Dark: `text-gray-900` (Text on light backgrounds)
  - Dimmed: `text-off-white/90` (Secondary text, labels)
- Borders: `border-off-white/15` (Subtle borders on dark backgrounds)

### State Colors
- Success: `#34A853` (Confirmed actions)
- Error: Red tones (for error messages)
  - Background: `bg-red-100`
  - Border: `border-red-300`
  - Text: `text-red-800`

### Implementation
```tsx
// In tailwind.config.js
colors: {
  'off-white': '#f8f9fa',
  'figma-green': '#145345',
  'figma-green-light': '#86efac',
}
```

## 3. Components

### Cards
- Main container:
  - `w-full max-w-[325px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5`
  - Frosted glass effect with subtle border and shadow
  - Fixed max width of 325px, padding of 1.25rem (20px)

### Buttons
- Primary Button (Action):
  - `w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors shadow-md text-sm`
  - Green background with white text
  - Height of 3rem (48px), rounded corners
  - Darker green on hover
  - Full width to match inputs

- Social/Secondary Button:
  - `w-full h-12 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm hover:bg-off-white/90 active:bg-white transition-all text-gray-700 text-sm`
  - Translucent white background
  - Same dimensions as primary button
  - Subtle hover effect

### Form Elements
- Input Fields:
  - Label: `text-xs font-normal text-off-white/90`
  - Input: `w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm`
  - Height of 3rem (48px) to match buttons
  - Translucent white background that becomes fully white on focus
  - Green focus ring

### Dividers
- Horizontal divider with text:
  ```tsx
  <div className="flex items-center my-6">
    <div className="flex-1 h-px bg-off-white/30"></div>
    <span className="px-3 text-xs text-off-white/90">Or</span>
    <div className="flex-1 h-px bg-off-white/30"></div>
  </div>
  ```

### Links
- Standard link style:
  - `text-xs text-[#84F7AC] hover:underline transition-colors`
  - Light green with underline on hover

## 4. Spacing and Layout

### Containers
- Page container: Centered flex column with full height
- Content max width: 325px for auth/onboarding cards

### Spacing Scale
- Small: `space-y-1` (4px) - Used between related elements like label and input
- Medium: `space-y-3` (12px) - Standard spacing between form elements
- Large: `mt-7` (28px) - Increased spacing before main buttons
- XL: `mb-8` (32px) - Space between logo and content
- Section spacing: `my-6` (24px) - Between major sections (form and divider)

### Layout Patterns
- Vertical stacking with centered alignment
- Logo positioned at top with ample margin
- Form elements stacked with consistent spacing
- Primary action button with increased spacing before it
- Secondary actions/links at bottom

## 5. Effects and Transitions

### Backdrop Blur
- Card backdrop blur: `backdrop-blur-xl` (heavy blur for main container)
- Input/button backdrop blur: `backdrop-blur-sm` (subtle blur for interactive elements)

### Shadows
- Card shadow: `shadow-xl` (prominent shadow for main container)
- Button shadow: `shadow-md` (medium shadow for buttons)

### Transitions
- Color transitions: `transition-colors` (for hover effects)
- All properties: `transition-all` (for more complex interactions)
- Standard duration: 200ms (default in Tailwind)

### Animations
- Loading spinner: `animate-spin`

## 6. Responsive Behavior

### Breakpoints
- Mobile first approach with SM (640px) breakpoint for slightly larger text

### Text Adjustments
- Headings scale up at SM breakpoint: `text-xl sm:text-2xl`

### Layout Adjustments
- Consistent padding with side adjustments: `px-4 py-8 sm:px-6`

## 7. Usage Guidelines

### Page Structure Pattern
1. Full-height container with gradient background
2. Centered content column
3. Logo at top with consistent sizing
4. Card container with content
5. Clear heading indicating the step/action
6. Form elements with consistent spacing
7. Primary action button with proper spacing
8. Secondary options (links, social login) at bottom

### Form Structure
- Group related inputs (first name/last name)
- Show inline validation errors
- Maintain consistent spacing
- Place primary action button with extra spacing

### Accessibility Considerations
- Maintain sufficient color contrast
- Use proper ARIA labels
- Ensure focus states are visible
- Keep text size readable

### Responsiveness
- Design mobile-first
- Adjust text size at breakpoints
- Maintain touch-friendly sizing for inputs and buttons

## 8. Animation Guidelines

- Use subtle transitions for hover/focus states
- Apply consistent loading indicators
- Keep animations simple and purposeful
- Standard timing functions: ease-in-out

## 9. Implementation Tips

- Create reusable Tailwind classes in components
- Use CSS variables for theme colors
- Maintain consistent spacing across pages
- Follow the component patterns for all new features 