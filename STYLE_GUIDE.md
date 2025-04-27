# NutriFlow Auth & Payment Flow Style Guide

This style guide documents the UI/UX patterns observed in the authentication (`login.tsx`, `signup.tsx`), plan selection (`choose-plan.tsx`), and payment confirmation (`payment-success.tsx`) flows as of the last analysis.

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
- **Loading Spinner:** White (`text-white`)
- **Pill Button (Active):** Light Green Background (`bg-green-200`), Border (`border-green-400`), Text (`text-green-900`)
- **Pill Button (Inactive):** Translucent Off-White (`bg-off-white/20`), Border (`border-off-white/30`)

*(Note: `off-white` is likely a custom color defined in `tailwind.config.js`)*

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
- **Content Container:** Centered (`mx-auto`), width constrained (`max-w-sm` / `max-w-[325px]` for login, `max-w-[370px]` for signup, `max-w-md` for choose plan, `max-w-[400px]` for payment success). `p-4` or `p-5` page padding.

### Spacing

- **General Form Element Spacing:** `space-y-3` or `space-y-4` within forms.
- **Card Padding:** `p-5` or `p-6` (e.g., `bg-off-white/20` card).
- **Margins:** Commonly `mb-` (e.g., `mb-6`, `mb-8` between sections), `mt-` (e.g., `mt-6`, `mt-7` for buttons/links).
- **Input Label Margin:** `mb-1.5`
- **Button Top Margin:** Often `pt-4` or `mt-7` within forms.
- **Divider Margin:** `my-6` (`choose-plan.tsx` social login divider).
- **Plan Card Spacing:** `space-y-4` between plan cards.
- **Plan Feature List Spacing:** `space-y-1.5`.

## 3. Core Component Rules

### Buttons

- **Primary Action (e.g., Log in, Sign up, Next):**
    - **Base:** `w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal text-sm flex items-center justify-center shadow-md transition-colors`
    - **Hover:** `hover:bg-[#2c9247]`
    - **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed`
- **Social Login (Google):** Uses `SocialLoginButton` component (styling defined within).
- **Back Button (Choose Plan):** `text-off-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0` (Icon only).
- **Plan Selection Cards:** Act as buttons. See Cards section.
- **Pill Buttons (Onboarding):**
    - **Base:** `px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]`
    - **Inactive:** `bg-off-white/20 border-off-white/30 hover:bg-off-white/30 text-off-white`
    - **Active:** `bg-green-200 border-green-400 ring-2 ring-green-500 text-green-900`
- **Text Links:** `text-xs` or `text-sm`, often `text-[#84F7AC]` or `text-green-200`, `hover:underline`.

### Input Fields & Labels

- **Label:**
    - **Style:** `block text-xs font-normal text-off-white/90 mb-1.5`
- **Standard Input (Text, Email, Password, etc.):**
    - **Base:** `w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 text-sm font-['Poppins',sans-serif] transition-all`
    - **Placeholder:** `placeholder-gray-400/80`
    - **Focus:** `focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white`
- **Textarea:**
    - **Base:** `w-full p-3.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 text-sm font-['Poppins',sans-serif] transition-all` (Style like Input)
    - **Placeholder:** `placeholder-gray-400/80`
    - **Focus:** `focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white`
    - **Sizing:** Height controlled by `rows` attribute.
- **Select:**
    - **Base:** Base Input style + `appearance-none`.
    - **Arrow:** Custom SVG overlay used for dropdown indicator.
- **Modular Date Input (e.g., Date of Birth):**
    - **Structure:** Uses 3 separate, horizontally stacked (`flex space-x-2`) number inputs.
    - **Individual Fields (DD, MM):** `w-16 text-center px-1` based on base input style.
    - **Individual Field (YYYY):** `flex-grow` based on base input style.
    - **Behavior:** Each field takes numeric input, placeholders `DD`, `MM`, `YYYY`. Combined into `YYYY-MM-DD` string in code.
- **Numeric Stepper Input (e.g., Height, Weight):**
    - **Structure:** `flex items-center justify-between` container with base input styles (`h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80`).
    - **Controls:** `[-]` and `[+]` buttons (`lucide-react` icons, `p-1 rounded-full text-gray-600 hover:bg-black/10 active:bg-black/20`).
    - **Display:** Clickable `<span>` showing value + unit (`text-sm text-gray-900 cursor-pointer`).
    - **Manual Input:** Clicking display reveals a temporary `<input type="number">` (`w-20 text-center px-1 mx-2` based on input style but **without focus ring**). Saves on blur or Enter.
    - **Unit Toggle:** Separate component (`flex space-x-1 bg-white/10 p-1 rounded-full ml-2`) with active (`bg-green-200 text-green-800 font-medium`) and inactive states.
- **"Other" Input (Transformed Selection):**
    - **Use Case:** Appears when an "Other" `SelectionCard` is chosen, replacing the card.
    - **Style:** `w-full h-auto p-4 rounded-lg border border-[#84F7AC] bg-green-100 backdrop-blur-sm text-green-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#84F7AC] transition-all font-['Poppins',sans-serif]` (Matches active `SelectionCard` appearance).
    - **Placeholder:** `placeholder-green-700/60`.
- **"Other" Input (Inline Pill):**
    - **Use Case:** Appears next to an "Other" `PillButton` when selected.
    - **Style:** `h-10 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]` (Standard input style, potentially sized with `w-48`).
    - **Placeholder:** `placeholder-gray-400/80`.

- **Error State:**
    - **General:** Separate box (`mt-1 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center`).
    - **Input-Specific (Auth):** Displayed below input (`text-xs text-red-200`).

### Cards/Containers

- **Main Content Card (Login, Signup, Onboarding):**
    - **Style:** `w-full max-w-[WIDTH] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5` (Max-width varies slightly)
- **Plan/Goal Selection Card (`SelectionCard.tsx`):**
    - **Base:** `block w-full p-4 border rounded-lg text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]`
    - **Inactive:** `bg-off-white/10 border-off-white/20 text-off-white/80 focus:ring-green-300` (Title `font-light`, Icon `text-off-white/80`)
    - **Active:** `bg-green-100 border-[#84F7AC] text-green-900 focus:ring-[#84F7AC]` (Title `font-semibold`, Icon `text-green-700`)

## 4. Page-Specific Guidelines

- **`