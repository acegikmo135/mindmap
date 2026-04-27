# The Design System: Academic Luminary

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Atelier."** 

Unlike generic educational platforms that feel like sterile databases, this system is designed to feel like a premium, curated study environment. We are blending the intellectual authority of a traditional library with the fluid, effortless power of modern AI. 

We move beyond the "template" look by embracing **Intentional Asymmetry** and **Editorial Scale**. By pairing high-contrast, elegant serifs with a hyper-functional UI, we create a "Sense of Occasion" for learning. We don't just display information; we frame it as a pursuit of excellence.

---

## 2. Color & Tonal Architecture
The palette is rooted in deep Indigos and soft, atmospheric neutrals. The goal is to reduce cognitive load while maintaining an "Empowering" energy.

### Color Tokens
- **Primary:** `primary` (#3130c0) to `primary_container` (#4b4dd8) gradient. This represents the "Glow of Intelligence."
- **Secondary:** `secondary` (#515f74) — used for utility and supportive UI elements.
- **Surface Hierarchy:** 
  - `surface_container_lowest` (#ffffff): Use for cards or elevated content.
  - `surface_container_low` (#f1f4f9): Use for primary background sections.
  - `surface` (#f7f9fe): The global canvas.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited for sectioning.** 
Boundaries must be defined through background color shifts. For example, a student’s "Daily Goals" section (`surface_container_lowest`) should sit on the global `background` without a stroke. The change in tone is the boundary.

### The Glass & Gradient Rule
Floating elements (modals, popovers, or navigation overlays) should utilize **Glassmorphism**. 
- **Effect:** Apply a `surface` color at 80% opacity with a `20px` backdrop blur.
- **CTAs:** Main action buttons must use the Indigo-to-Violet gradient to provide a "Visual Soul" that flat colors cannot replicate.

---

## 3. Typography: The Editorial Voice
We use typography to distinguish between "Learning Content" (Academic) and "Platform Tools" (Functional).

- **Display & Headlines:** *Instrument Serif* (or *Newsreader*). 
  - Use this for chapter titles, big milestones, and empty-state headlines. It provides an authoritative, "published" feel.
- **UI & Interaction:** *Inter*.
  - Used for navigation, buttons, and data density. It is the workhorse of the interface.
- **Technical/Code:** *JetBrains Mono*.
  - Reserved strictly for AI logic snippets, math formulas, or code blocks.

### Typography Scale
| Role | Font | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display-LG** | Instrument Serif | 3.5rem | 400 | Hero moments / Title cards |
| **Headline-MD** | Instrument Serif | 1.75rem | 400 | Chapter starts / Module headers |
| **Title-MD** | Inter | 1.125rem | 600 | Card titles / Sidebar items |
| **Body-LG** | Inter | 1rem | 400 | Primary reading text |
| **Label-SM** | Inter | 0.6875rem | 500 | Metadata / Micro-copy |

---

## 4. Elevation & Depth
In this system, depth is a functional tool, not a decoration. We use **Tonal Layering** to convey hierarchy.

### The Layering Principle
Stack surfaces to create focus.
1. **Level 0:** `surface` (The desk).
2. **Level 1:** `surface_container_low` (The notebook).
3. **Level 2:** `surface_container_lowest` (The active page/card).

### Ambient Shadows
Shadows must be "Ambient," mimicking natural light.
- **Shadow Token (md):** `0 4px 16px rgba(15, 23, 42, 0.08)`.
- The shadow should never be pure black; use a tinted version of `on_surface` to keep it soft and integrated.

### The Ghost Border Fallback
If an element lacks sufficient contrast (e.g., in Sepia mode), use a **Ghost Border**.
- **Rule:** `outline_variant` (#c7c4d8) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** Indigo gradient background, `on_primary` text. Use a subtle "Indigo Glow" shadow when hovered.
- **Secondary:** `surface_container_highest` background with `primary` text. No border.
- **Shape:** `10px` (DEFAULT) corner radius.

### Cards
- **Construction:** Use `xl` (1.5rem) or `lg` (1rem) corner radius. 
- **Rule:** No dividers. Separate card header from body using a 24px vertical gap or a subtle shift from `surface_container_highest` to `surface_container_lowest`.

### Input Fields
- **Style:** High-fidelity. `surface_container_lowest` background with a `ghost border`.
- **Focus State:** The border transitions to a 1.5px solid `primary` with a soft primary glow.

### Sidebar (Navigation)
- **Width:** 240px.
- **Structure:** Use `surface_container_low`. The active state should not be a box, but a "Pill" shape that uses the `primary_fixed` color to highlight the current selection.
- **Gamification:** Integrate the student's "Points" in a glassmorphic card at the bottom of the sidebar.

---

## 6. Do’s and Don’ts

### Do
- **Use White Space as a Tool:** Give the "Display" typography room to breathe. High-end design is defined by what you leave out.
- **Embrace Sepia for Focus:** Use the Reading Mode tokens (`#FBF6EE`) strictly for long-form content to signal a "Deep Work" state to the student.
- **Subtle Motion:** All transitions should be `300ms` with a "Quartic Out" easing to feel sophisticated and fluid.

### Don’t
- **Don’t use 100% Black:** Use `text-primary` (#0F172A) for high contrast. Pure black feels harsh and unrefined.
- **Don’t use Default Grids:** Offset your layout occasionally. Let a card "break" the margin or overlap a background container to create visual interest.
- **Don’t use Divider Lines:** If you feel the need to add a line, try adding 16px of extra padding instead. Use space to define relationships.

### Accessibility Note
While we prioritize a premium "No-Line" aesthetic, ensure that the `outline` token is used for focus rings during keyboard navigation to remain WCAG 2.1 compliant.