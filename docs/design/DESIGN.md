---
name: Cognitive Flow
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#95002b'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf0f3c'
  on-tertiary-container: '#ffd0d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: auto
  max-width-content: 600px
---

## Brand & Style

The design system is engineered for **Flashcards AI**, balancing academic rigor with modern accessibility. The brand personality is that of an "intelligent companion"—reliable and structured, yet encouraging and fluid. It targets lifelong learners, students, and professionals who require high-focus environments free from cognitive clutter.

The aesthetic follows a **Modern Minimalist** approach. By prioritizing heavy whitespace and high-contrast typography, the design system ensures that the learning content remains the focal point. Soft shadows and subtle depth cues are used to make the interface feel tactile and responsive to touch, while the elimination of unnecessary ornamentation reduces mental fatigue during long study sessions.

## Colors

The color palette is functional and semantic, designed to provide immediate feedback during the active recall process.

*   **Primary (Indigo):** Used for brand identity, primary actions, and focus states. It represents stability and intelligence.
*   **Secondary (Emerald):** Reserved specifically for "Success" states and the "Got it" action. It provides a positive psychological reinforcement.
*   **Tertiary (Rose):** Used for "Review again" actions and error states. It is high-visibility to ensure users acknowledge areas needing improvement.
*   **Neutral (Slate/White):** A clean range of greys and whites to maintain a calm, paper-like background that prevents eye strain.

## Typography

This design system utilizes **Inter** for its exceptional readability on digital screens and its neutral, systematic character. 

The type scale is generous, particularly for body text, to ensure that flashcard content is legible at arm's length. Headlines use a tighter letter-spacing and heavier weights to create a strong visual anchor. Label styles are used for metadata (e.g., "Card 5 of 20") and button text, ensuring a clear distinction between UI controls and educational content.

## Layout & Spacing

This design system adopts a **Mobile-First Fixed Grid** philosophy. Since learning often happens on the go, the layout is optimized for single-handed thumb interaction.

*   **Mobile:** 1-column layout with 20px side margins. Elements are vertically stacked to maximize the width available for text-heavy flashcards.
*   **Tablet/Desktop:** The content is constrained to a maximum width of 600px and centered on the screen. This "focus mode" layout prevents long line lengths that hinder reading speed.
*   **Spacing Rhythm:** All spacing is based on a 4px baseline grid. MD (16px) is the standard padding for containers, while LG (24px) is used to separate distinct sections of information.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and tonal layering. This creates a "stacked paper" effect that feels natural for an educational tool.

1.  **Level 0 (Background):** The base layer uses the Neutral background color (#F8FAFC).
2.  **Level 1 (Cards/Inputs):** Floating elements use a pure white surface with a soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)).
3.  **Level 2 (Active/Pressed States):** When a user interacts with a card, the shadow tightens and the element scales slightly (98%) to simulate physical compression.
4.  **Navigation:** The bottom navigation bar uses a subtle top border and a backdrop blur (Glassmorphism) to stay visible over scrolling content without feeling heavy.

## Shapes

The shape language is friendly and modern, utilizing **Rounded** corners to reduce the perceived complexity of the academic content. 

Standard components (Inputs, Chips) use a 0.5rem (8px) radius. Larger containers, specifically the main Study Cards, use a 1rem (16px) radius to emphasize their importance and make them feel comfortable to "hold" in a mobile interface. Buttons follow a pill-shaped or high-radius approach to clearly signal clickability.

## Components

### Study Cards
The centerpiece of the system. Cards must have a minimum height of 320px on mobile to ensure a large touch target for flipping. Content should be vertically and horizontally centered.

### Primary Actions
The "Got it" and "Review again" buttons are positioned at the bottom of the screen for easy thumb access. They use full-width or large-split layouts.
- **Got it:** Emerald background, white text.
- **Review again:** Rose secondary or ghost style with a Rose border.

### Progress Bars
Minimalist 8px tall bars using the Neutral-200 track and Primary Indigo fill. They are placed at the very top of the study session to provide a constant sense of momentum without distraction.

### Inputs & Search
Fields use a subtle grey border that transitions to a 2px Indigo border on focus. Labels always sit above the field in the `label-sm` style.

### Bottom Navigation
Designed for mobile, featuring four primary destinations with clear icons and `label-sm` text. The active state is indicated by a primary indigo tint on both icon and text.