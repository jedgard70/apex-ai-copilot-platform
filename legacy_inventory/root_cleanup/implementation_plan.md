# Implementation Plan: Apex AI Copilot Cinematic Landing Page

## 1. Entry Point Identification
I have successfully identified the actual main entry point for the landing page. In `src/main.tsx`, unauthenticated users visiting the root route (`/`) are routed to `src/components/BusinessOnboardingFlow.tsx` (around line 4140). Currently, this component displays a massive list of 85+ text elements on the right side and generic background shapes—which is why the layout looks cluttered, repetitive, and lacks the immediate visual punch expected from a premium platform. 

## 2. The Vision: Stunning, Luxurious, and Cinematic
We will completely overhaul the `BusinessOnboardingFlow.tsx` component (or create a dedicated `CinematicLandingPage.tsx` and route to it in `main.tsx`). The new design will follow the **Dark Navy / Cyan** Apex Global identity, utilizing heavy glassmorphism, dynamic grid layouts, and modern typography (Inter/JetBrains Mono). 

### Hero Section (Above the Fold)
- **Immediate Impact**: A breathtaking, high-fidelity hero section featuring a dynamic, cinematic architectural/BIM visual background (not hidden behind a login wall). 
- **Core Value**: Clear, powerful messaging ("Inteligência aplicada à construção, arquitetura e negócios imobiliários").
- **CTA**: Prominent "Comece a criar" ou "Acessar Plataforma" buttons that smoothly transition the user to the `SplitAuthScreen` without forcing them away from the marketing context immediately.

### The 8 Pillars of Apex AI
Instead of a wall of 85 unorganized features, we will showcase the **8 Intelligence Layers (Pillars)** defined in the master architecture, each paired with its own **unique, high-quality cinematic image** to avoid any repetition. 
1. **Intelligence Core Dashboard**
2. **BIM Intelligence Layer** 
3. **Visual Intelligence Layer**
4. **Predictive Analytics Layer**
5. **Autonomous Decision Layer**
6. **Digital Twin Layer**
7. **Financial Intelligence Layer**
8. **Hyperautomation Layer**

We will use bento-box grids or horizontal scroll cards with beautiful hover states and distinct imagery for each pillar. If needed, I will generate distinct image prompts/placeholders that look hyper-realistic and futuristic.

## 3. Transition to Authentication
The actual login/registration will be accessible instantly via the top navigation and primary CTAs. Clicking them will smoothly reveal the `SplitAuthScreen` modal or panel over the cinematic background, ensuring the user experiences the grandeur of the platform *before* being asked to sign in.

## 4. Execution Steps
1. **Create/Update Component**: Rewrite `src/components/BusinessOnboardingFlow.tsx` with Tailwind CSS v4 to build the new landing page.
2. **Image Sourcing**: Inject varied, high-quality architectural, tech, and BIM-related images specifically mapped to each of the 8 pillars. No repeated images.
3. **Refine Styling**: Apply the existing `design-tokens.css` and `theme-dark-premium.css` for absolute luxury (glow effects, premium borders, deep dark backgrounds).
4. **Test**: Run the local build (`npm run build`) to ensure the transition from the landing page to the auth screen works flawlessly.

**Please approve this plan**, and I will immediately proceed with writing the code and crafting the perfect cinematic landing page!
