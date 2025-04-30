# NutriFlow Style Guide

This style guide documents the UI/UX patterns across the entire NutriFlow application, including authentication, onboarding, home screens, and scanner functionality. It provides guidance for maintaining consistency in future development using shadcn/ui components and our custom design system.

## 1. Branding Elements

### Color Palette

- **Primary Background:** Gradient Dark Green (`bg-gradient-to-b from-[#14532D] to-[#0A4923]`)
- **Primary Action:** Bright Green (`#34A853` used for buttons, icons)
- **Primary Action Hover:** Darker Green (`#2c9247` used for button hover)
- **Accent/Link:** Light Green (`#84F7AC` used for links, selected borders)
- **Text (Primary on Dark):** Off-White (`text-off-white`, often with opacity `text-off-white/90`, `text-off-white/80`, `text-off-white/70`, `text-off-white/60`)
- **Text (On Light Elements):** Dark Gray/Black (`text-gray-900` on inputs, `text-green-900` on active pills)
- **Container Background:** Translucent Off-White (`bg-off-white/20` with `backdrop-blur-xl`)
- **Container Border:** Translucent Off-White (`border-off-white/15`, increases opacity on hover `hover:border-off-white/40` for plan cards)
- **Input Background:** Semi-Transparent Off-White (`bg-off-white/80`)
- **Input Background (Focus):** White (`focus:bg-white`)
- **Input Placeholder:** Gray (`placeholder-gray-400/80`)
- **Error Text:** Light Red (`text-red-200`)
- **Error Background:** Translucent Red (`bg-red-700/20` with `border-red-500/30`)
- **Success Background:** Translucent Green (`bg-green-800/30` with `border-green-500/30`)
- **Loading Spinner:** White (`text-white`)
- **Pill Button (Active):** Light Green Background (`bg-green-200`), Border (`border-green-400`), Text (`text-green-900`)
- **Pill Button (Inactive):** Translucent Off-White (`bg-off-white/20`), Border (`border-off-white/30`)
- **Scanner Background:** Black (`bg-black` for best camera feed contrast)

*(Note: `off-white` is defined in `tailwind.config.js` as a custom color)*

### Logo

- **Usage:** Appears prominently on the Login page (`login.tsx`).
- **Placement:** Centered, above the main content card.
- **Sizing:** `h-20 w-64` (80px height, 256px width).
- **File:** `/images/Forkcast_Logo.svg`

### Typography

- **Primary Font:** Poppins (`font-['Poppins',sans-serif]`)
- **Headings (Primary):** `text-xl sm:text-2xl font-light text-off-white text-center` (Used for main titles like "Welcome Back", "Create Your Profile", onboarding step titles)
- **Headings (Secondary):** `text-lg font-light text-center` (Used for sub-headings like onboarding sub-sections)
- **Body Text (Standard):** `text-sm text-off-white/90` or `text-off-white/80`
- **Body Text (Small):** `text-xs` (Used for descriptions, disclaimers, small notes)
- **Input Labels:** `text-xs font-normal text-off-white/90`
- **Input Text/Placeholder:** `text-sm`
- **Button Text (Primary):** `text-sm font-normal`
- **Link Text:** `text-xs` (often with `font-normal`, `hover:underline`, color `#84F7AC`)
- **Plan Card Titles:** `font-medium`

## 2. Layout & Spacing

### Layout

- **Overall:** Full height (`min-h-screen`), flexbox column (`flex flex-col`), items centered (`items-center`). Login/Signup also use `justify-center`.
- **Content Container:** Centered (`mx-auto`), width constrained:
  - Authentication: `max-w-sm` / `max-w-[325px]` for login, `max-w-[370px]` for signup
  - Onboarding: `max-w-sm`
  - Home/Scanner: `max-w-md`
- **Page Padding:** `p-4` or `p-5`
- **Card Padding:** `p-5` or `p-6` (for main content cards)

### Spacing

- **General Form Element Spacing:** `space-y-3` through `space-y-5` within forms.
- **Margins:** Commonly `mb-` (e.g., `mb-6`, `mb-8` between sections), `mt-` (e.g., `mt-6`, `mt-7` for buttons/links).
- **Input Label Margin:** `mb-1.5`
- **Button Top Margin:** Often `pt-4` or `mt-7` within forms.
- **Section Divider:** `border-off-white/30 my-6`
- **Plan Card Spacing:** `space-y-4` between plan cards.

## 3. Component Library

NutriFlow uses a combination of shadcn/ui components and custom styled components. When extending or creating new pages, follow these rules:

### Standard Components (shadcn/ui)

- `Button`: Used for primary actions and navigation
- `Calendar`: Used for date pickers in forms
- `Popover`: Used for date pickers and other dropdown content
- `Select`: Used for dropdown selections
- `Input`: Standard text input fields
- `Card`: For content containers (with modifications for our styling)
- `Separator`: For horizontal dividers 

### Custom Components

- `OnboardingLayout`: Wrapper for onboarding screens with step indicators
- `PillButton`: Button with pill shape for multi-selection UI
- `AppShell`: Base layout with header and footer for main app screens

## 4. Core Component Rules

### Buttons

- **Primary Action (e.g., Log in, Sign up, Next):**
  ```javascript
  const buttonPrimaryStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  ```
- **Secondary Action (e.g., View History):**
  ```javascript
  const buttonSecondaryStyle = "w-full h-12 rounded-lg bg-off-white/20 border border-off-white/30 hover:bg-off-white/30 text-off-white font-normal flex items-center justify-center shadow-md text-sm transition-colors";
  ```
- **Pill Buttons (Onboarding):**
  ```javascript
  // Base Style
  const baseStyle = "min-h-[44px] inline-flex items-center justify-center px-3 sm:px-4 py-2 border rounded-full cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923] text-base text-center";
  // Inactive State
  const inactiveStyle = "bg-off-white/10 border-off-white/20 text-off-white/80 focus:ring-green-300 hover:bg-off-white/20";
  // Active State
  const activeStyle = "bg-green-100 border-[#84F7AC] text-green-900 focus:ring-[#84F7AC]";
  ```
- **Icon Buttons (Navigation):**
  ```javascript
  const iconButtonStyle = "p-2 rounded-full text-off-white hover:bg-white/10 transition-colors";
  ```
- **Back Button (Onboarding):**
  ```javascript
  const backButtonStyle = "text-off-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors";
  ```

### Input Fields & Labels

- **Label:**
  ```javascript
  const labelStyle = "block text-xs font-normal text-off-white/90 mb-1.5";
  ```
- **Standard Input (Text, Email, Password):**
  ```javascript
  const inputStyle = "w-full h-12 px-4 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-base font-['Poppins',sans-serif]";
  const inputPlaceholderStyle = "placeholder-gray-400/80";
  ```
- **Textarea:**
  ```javascript
  const textareaStyle = "w-full p-3.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]";
  ```
- **Select (shadcn):**
  ```javascript
  const selectTriggerStyle = `${inputStyle} text-left justify-start [&>span]:text-gray-400/80 data-[placeholder]:font-normal`;
  ```
- **Numeric Stepper Input (Height, Weight):**
  ```javascript
  // Container
  const numberDisplayContainerStyle = "flex items-center justify-between w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm";
  // Value Display
  const numberDisplayText = "text-base text-gray-900 font-['Poppins',sans-serif]";
  // +/- Buttons
  const plusMinusButton = "p-1 rounded-full text-gray-600 hover:bg-black/10 active:bg-black/20 transition-colors";
  ```
- **Unit Toggle:**
  ```javascript
  // Container
  const unitToggleContainerStyle = "flex space-x-1 bg-white/10 p-0.5 rounded-full ml-2";
  // Button
  const unitToggleStyle = "min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-1 text-base rounded-full cursor-pointer transition-colors";
  // States
  const activeUnitStyle = "bg-green-200 text-green-800 font-medium border border-green-400 shadow-sm";
  const inactiveUnitStyle = "bg-gray-500 text-gray-100 hover:bg-gray-600";
  ```

### Message Containers

- **Error Messages:**
  ```javascript
  const errorBoxStyle = "mt-4 p-3 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-sm text-center";
  ```
- **Success Messages:**
  ```javascript
  const successBoxStyle = "mb-4 p-3 bg-green-800/30 border border-green-500/30 text-green-200 rounded-lg text-sm text-center flex items-center justify-center space-x-2";
  ```
- **Information Cards:**
  ```javascript
  const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5";
  ```

### Footer Navigation

- **Footer Container:**
  ```javascript
  const footerStyle = "sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50";
  ```
- **Footer Nav Item:**
  ```javascript
  // Inactive
  const footerNavItemStyle = "flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors";
  // Active
  const footerNavItemActiveStyle = "flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium";
  ```

## 5. Screen-Specific Guidelines

### Authentication Flow

The authentication screens use a centered card layout with a logo above, and social login options.

- **Login/Signup Card:** `max-w-sm bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5`
- **Auth Inputs:** Full-width, spaced 16px apart
- **Social Login:** Google login centered below main form with "Or" divider

### Onboarding Flow

Onboarding uses a step-by-step card layout with progress indicators and clear section titles.

- **Layout:** OnboardingLayout component with step indicators
- **Progress Dots:** Small circles showing current and total steps
- **Section Dividers:** Used between related form sections
- **Next Button:** Primary action button at bottom of card

### Home & Scan Screens

The home screen offers quick access to scanning with a simple toggle between welcome view and camera.

- **Header:** App name left, profile button right
- **Welcome Card:** Personal greeting and app description
- **Action Area:** Centered icon, description, and action buttons
- **Footer:** Sticky navigation with Home, Scan, History, and Profile options
- **Scanner View:** Black background with camera feed and control buttons

## 6. Interaction & Animation

- **Buttons:** Use `transition-colors` for smooth color changes on hover/focus
- **Loading States:** Show spinner animation with descriptive text
- **Selection Feedback:** Immediate visual feedback for selections (color change, border)
- **Camera Feed:** Fade in when ready, overlay processing indicators during scan

## 7. Accessibility Guidelines

- **Color Contrast:** Maintain readable contrast, especially on translucent backgrounds
- **Text Size:** Minimum 14px (text-sm) for body text, 12px (text-xs) for secondary information
- **Focus Indicators:** Use `focus:ring-2` with appropriate colors for keyboard navigation
- **Touch Targets:** Minimum 44x44px for interactive elements (especially on mobile)
- **Loading States:** Always indicate loading with both visual spinner and text
- **Error States:** Clear error messages with distinctly colored background

## 8. Implementation Notes

- Use shadcn/ui components as the foundation when available
- Extend components with our custom styling using the `className` prop
- Maintain the frost glass effect with `backdrop-blur-xl` on containers
- Follow the established green gradient theme for backgrounds
- Use the defined color system consistently across new components