# CogniStruct — Claude Design Prompt

> Paste this entire prompt into Claude Design (claude.ai/design or Projects with design capability).
> It is self-contained — no other context file needed.

---

## Project Brief

Design the complete, production-rWeady UI for **CogniStruct** — an AI-powered study platform for Indian school students in **Class 6–10**. The product lives entirely inside a React SPA. The shell is a **fixed sidebar (240px) + main content area**. Design all screens at 1440×900 (desktop) and 390×844 (mobile iPhone 14 size).

**Brand personality:** Smart but warm. Feels like a premium app a student would actually enjoy opening — not a boring textbook. Think Notion × Duolingo × Linear.

---

## Design Tokens (use these exactly)

### Color Palette

```
PRIMARY (Indigo)
  primary-50:   #EEF2FF
  primary-100:  #E0E7FF
  primary-200:  #C7D2FE
  primary-300:  #A5B4FC
  primary-400:  #818CF8
  primary-500:  #6366F1   ← main brand color
  primary-600:  #4F46E5
  primary-700:  #4338CA

SEMANTIC
  success:  #10B981  (mastered concepts, correct answers, accept actions)
  warning:  #F59E0B  (points/gamification, amber accents)
  danger:   #EF4444  (errors, wrong answers, decline actions)
  violet:   #8B5CF6  (gradient partner to primary)
  cyan:     #06B6D4  (accent complement)

LIGHT MODE
  bg:         #F8FAFF   ← slightly cool white (NOT pure white)
  surface:    #FFFFFF   ← cards, sidebar
  surface-2:  #F1F5FE   ← inputs, secondary surfaces, hover states
  border:     #E4EAF6   ← very subtle borders
  text-1:     #0F172A   ← primary headings
  text-2:     #475569   ← body text, labels
  text-3:     #94A3B8   ← muted text, placeholders

DARK MODE
  bg:         #060C17
  surface:    #0F1829
  surface-2:  #162035
  border:     rgba(148,163,184,0.10)
  text-1:     #F1F5F9
  text-2:     #94A3B8
  text-3:     #475569
  primary-500 dark: #818CF8   ← slightly lighter for dark bg

READING MODE (Sepia — warm for eye comfort)
  bg:        #FBF6EE
  surface:   #F5EDD8
  surface-2: #EDE0C4
  border:    #D4C4A0
  text-1:    #3D2B1F
  text-2:    #7A5C40
  accent:    #C2782A
```

### Typography

```
FONTS
  Display (headings):  "Instrument Serif" — italic style often used for hero text
  UI (everything else): "Inter"
  Code (markdown):     "JetBrains Mono"

SCALE
  xs:   11px, weight 500, line-height 1.5
  sm:   13px, weight 400, line-height 1.6
  base: 15px, weight 400, line-height 1.65
  md:   17px, weight 600, line-height 1.6
  lg:   20px, weight 700, line-height 1.4
  xl:   24px, weight 700, line-height 1.3
  2xl:  32px, weight 800, line-height 1.2, letter-spacing -0.5px
  3xl:  40px, weight 800, line-height 1.1, letter-spacing -1px
  4xl:  48px, weight 800, line-height 1.05, letter-spacing -1.5px
```

### Spacing, Radius, Shadows

```
SPACING (8px grid): 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96

BORDER RADIUS
  btn:    10px
  input:  10px
  card:   16px
  lg:     20px
  xl:     24px
  pill:   9999px

SHADOWS
  sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
  md:   0 4px 16px rgba(0,0,0,0.08)
  lg:   0 8px 32px rgba(0,0,0,0.12)
  glow: 0 4px 24px rgba(99,102,241,0.30)
  glow-success: 0 4px 20px rgba(16,185,129,0.25)
  glow-amber:   0 4px 20px rgba(245,158,11,0.20)
```

---

## Screen Designs

Design each screen in light mode (primary). Add a dark mode variant for: Auth, Sidebar, Chapter Breakdown, and Doubt Solver.

---

### 1. AUTH SCREEN

**Desktop layout:** Two-panel split (60% left / 40% right)

**LEFT PANEL** — dark background (#060C17 to #0F1829 gradient)
- Top: Logo — 48×48 rounded-12 box with indigo→violet gradient + brain SVG icon in white + "CogniStruct" 32px Instrument Serif bold white
- Tagline: *"Your AI study companion"* — 20px Inter italic, text-3 color
- Feature list with stagger-in animation (6 items):
  - Each item: 18px colored icon (primary-400) + 15px text, gap 10px
  - Items: "AI Mind Maps", "Instant Doubt Solver", "Smart Quizzes", "Spaced Flashcards", "Leaderboard", "Study Community"
- Bottom badge: "For Class 6–10 · CBSE, ICSE & State Boards" — pill, primary-900/50 bg, primary-300 text
- Two floating blurred gradient orbs: one primary-500/20 (top right), one violet-500/15 (bottom left), ~300px each

**RIGHT PANEL** — bg surface #FFFFFF
- Max-width 420px card, centered vertically
- Padding 40px

**Sign In state:**
- "Welcome back" — 28px Instrument Serif bold, #0F172A
- "Don't have an account?" + "Sign up →" link in primary-600
- 24px spacer
- Email field: label "Email address" (11px uppercase text-3), input height 44px, rounded-10, leading Mail icon (18px text-3), border border, bg surface-2
- Password field: same + trailing Eye toggle icon
- "Forgot password?" — 13px text-3, right-aligned, below password
- 20px spacer
- CTA "Sign In" — full-width, 44px, rounded-10, gradient bg (primary-600 → violet-600), Inter 600 15px white, shadow-glow
- OR divider: 1px border lines with "or" text centered in text-3
- Google button: white bg, 1px border, 44px, rounded-10, Google SVG (20px) + "Continue with Google" Inter 500 15px text-2

**Error state (inline above form):**
- Alert card: red-50 bg, 1px red-200 border, rounded-10, 12px 16px padding
- Exclamation icon (red-500) + error text 14px red-700

**Sign Up state:**
- Same layout, heading "Create your account"
- Flip between states: 3D rotateY card flip animation (GSAP), 400ms

**Email Sent state (replaces form):**
- Centered: 80px circle with indigo gradient bg + white envelope SVG icon
- "Check your email" — 24px Instrument Serif bold
- Body text 15px text-2 centered, max-width 320px
- Email shown in primary-600 bold
- "Wrong email? ← Go back" link text-3

**Mobile:** Single panel, full-screen. Left panel collapses to just logo + tagline at top (40px strip, dark bg). Form card takes full width with 24px padding.

---

### 2. PROFILE POPUP (First-login Modal)

Overlay: rgba(0,0,0,0.60) backdrop-blur(8px)

Card: 440px wide, rounded-24, bg surface, shadow-lg, animate scale-in (Spring easing, 300ms)

- Top accent strip: 4px height, full width, gradient indigo→violet→cyan
- Padding: 32px
- Header row: 44px rounded-14 bg primary-100 box + Brain icon 22px primary-600, right of it: "Almost there!" 18px Inter 700 + "Tell us a bit about yourself — just once" 13px text-3
- 24px spacer
- Error banner (conditional): red-50 bg, red border, rounded-10, error text
- Name field: label "YOUR NAME" 10px uppercase tracking-wide text-3, input 44px, User icon leading, "Your full name" placeholder
- 16px spacer
- Grade field: label "CLASS / GRADE", Select element 44px, BookOpen icon leading, options "Select your class" + Class 6–10, custom chevron icon right
- 20px spacer
- CTA "Start learning →": full-width 44px, gradient bg, Sparkles icon left + "Start learning" text, rounded-10
  - Disabled: opacity-50, cursor-not-allowed (when fields empty)
  - Loading: spinner replaces Sparkles icon, "Setting up…" text

---

### 3. SUBJECT SELECTION (Home)

Max-width 1200px, centered, padding 48px 32px top

**Header:**
- "Good morning, Manthan 👋" — 32px Instrument Serif bold (dynamic greeting based on time)
- "Which chapter are you studying today?" — 17px text-2, mt-8
- Right side (desktop) OR below (mobile): "＋ Start new chapter" button — primary gradient, 10px rounded, 40px height, Plus icon

**Filters row (optional, below header):**
- Subject filter pills: "All" + Math/Science/History/etc — pill buttons, surface-2 bg, hover primary-50

**Chapter grid:**
- 3 columns desktop, 2 tablet, 1 mobile, gap 16px
- Grid starts 32px below header

**Chapter card:**
```
rounded-16, bg #FFFFFF, border 1px #E4EAF6, padding 20px
shadow-sm, hover shadow-md hover translateY(-2px) hover border-primary-200
transition 200ms

TOP ROW:
  Subject badge (pill, 11px uppercase, subject-specific color — see below)
  + "2 days ago" text-3 13px right-aligned

TITLE:
  16px Inter 700 text-1, mt-12, max 2 lines (clamp)

PROGRESS BAR:
  mt-16, 4px height, rounded-pill
  Track: surface-2 bg
  Fill: primary-500, width = % MASTERED
  Below: "3/7 concepts mastered" — 12px text-3, mt-6

BOTTOM ROW:
  mt-16, "Last studied: 2 days ago" 12px text-3
```

**Subject badge colors:**
- Mathematics → amber-100 bg, amber-700 text
- Physics → blue-100 bg, blue-700 text
- Chemistry → violet-100 bg, violet-700 text
- Biology → green-100 bg, green-700 text
- History → orange-100 bg, orange-700 text
- Geography → teal-100 bg, teal-700 text
- Civics → indigo-100 bg, indigo-700 text
- Others → slate-100 bg, slate-600 text

**"Add chapter" card (last in grid):**
```
Same size as chapter card
Border: 1.5px dashed #C7D2FE
Background: transparent
Center content: Plus icon 24px primary-300 + "Add new chapter" 14px text-3
Hover: bg primary-50, border primary-400, text primary-600
```

**Create Chapter drawer (slides up from bottom on mobile, right panel on desktop):**
```
Mobile: full-width bottom sheet, rounded-t-24, bg surface, shadow-lg
Desktop: right panel 400px, full height, slide in from right

Inside:
  Header: "New Chapter" 22px + X close button
  32px spacer
  "Topic" field: large input, "e.g. Gravitation, French Revolution..." placeholder
  16px spacer
  "Class" select: Grade options 6–10
  32px spacer
  CTA: "Generate with AI ✨" — full-width primary
  
  Loading state:
    Skeleton shimmer lines (3 rows varying width)
    "AI is structuring your chapter…" 14px text-3 centered below
```

---

### 4. CHAPTER BREAKDOWN (Dashboard)

Max-width 860px, centered

**Sticky header (on scroll):**
```
Padding: 20px 0 16px, border-bottom border
Row 1: Subject badge (colored pill) + back button "← Chapters" (text-3, 13px)
Row 2: Chapter title — 30px Instrument Serif bold, mt-4

Progress row:
  Thin progress bar (8px, rounded-pill, mt-8)
  Track: surface-2, Fill: primary-500
  Below: "4 of 7 concepts mastered" 13px text-3 + percentage badge right: "57%" pill primary-50 primary-700

Tool shortcuts (6 icon buttons, row):
  mt-12, gap 8px
  Each: 36px, rounded-10, border, bg surface-2, hover bg primary-50 hover border-primary-200
  Icons: BookOpenText | Network | BrainCircuit | Library | MessageCircleQuestion | Trophy
  Tooltip on hover (concept name)
```

**Concepts list:**
```
Section label: "CONCEPTS" — 10px uppercase letter-spacing 1.5px text-3, mt-32 mb-12

Concept row:
  Full-width, rounded-14, border 1px border, bg surface, padding 16px 20px
  mb-8, transition 150ms

  Left (40px):
    Status dot: 6px circle (color by status)
    Number: "01" etc — 11px text-3

  Center:
    Title: 16px Inter 600 text-1
    Description: 13px text-2, mt-4, max 2 lines
    Est. time: "~12 min" 11px text-3, mt-4 (clock icon + text)

  Right:
    Status badge: pill 11px uppercase
    "Start Learning →" button — hidden by default, slides in on row hover
      Primary bg, 13px Inter 600, 32px height

STATUS STYLES:
  LOCKED:
    Entire row: opacity 50%, cursor default
    Status dot: slate-300
    Badge: "Locked" — slate-100 bg, slate-500 text, Lock icon 10px prefix

  NOT_STARTED:
    Status dot: slate-400
    Badge: "Not Started" — slate-100 bg, slate-500 text

  IN_PROGRESS:
    Left border: 2px primary-500
    Background: primary-50/50
    Status dot: primary-500 (pulse animation)
    Badge: "In Progress" — primary-100 bg, primary-700 text, dot prefix

  MASTERED:
    Left border: 2px success (#10B981)
    Background: green-50/40
    Status dot: success green
    Badge: "Mastered ✓" — green-100 bg, green-700 text
    Title: slightly bolder, success color
```

---

### 5. WHOLE CHAPTER (AI Explanation)

Max-width 900px

**Header:**
```
Breadcrumb: "Science › Photosynthesis › Understand Chapter" — 12px text-3, links in text-2
Chapter title: "Photosynthesis" — 38px Instrument Serif bold, mt-8
Subtitle: "AI-generated comprehensive summary" — 15px text-3 italic
```

**Config section:**
```
2-column grid, gap 16px, mt-28
Card style: rounded-14, border, bg surface, padding 16px 20px

Card 1 — Length:
  Label: "EXPLANATION LENGTH" 10px uppercase text-3
  Segmented control: SHORT | STANDARD | LONG
    Container: rounded-10 surface-2 bg, p-1, mt-8
    Button: flex-1, py-8, rounded-8, 13px Inter 500
    Active: bg white shadow-sm, primary-600 text
    Inactive: text-3, hover text-2

Card 2 — Depth:
  Same format: BASIC | INTERMEDIATE | ADVANCED

Generate button (below cards, full-width):
  44px, rounded-10, gradient bg, "✨ Generate Explanation" Inter 600 15px
```

**Loading state:**
```
Full-width centered area, min-height 300px
Brain icon SVG 48px, primary-300 color, pulse animation (scale 0.95↔1.05)
"Generating explanation…" 15px text-3, mt-16
3 skeleton lines below (varying widths: 100%, 85%, 60%), mt-24
```

**Content (rendered Markdown):**
```
Prose container, mt-32, padding-top 24px, border-top border

Typography:
  h1: 30px Instrument Serif bold, mt-32 mb-16
  h2: 22px Inter 700, mt-28 mb-12, left border 3px primary-400, pl-14
  h3: 18px Inter 600, mt-20 mb-8, text-1
  p:  15px Inter 400, text-2, line-height 1.75, mb-16
  strong: text-primary-700 (light) / primary-300 (dark)
  ul: square bullets in primary-400, indent 20px, gap 8px
  li: 15px text-2
  code (inline): JetBrains Mono 13px, surface-2 bg, border, rounded-6, px-6 py-1
  pre: rounded-12, surface-2 bg, border, padding 20px, overflow-x auto
  blockquote: left border 3px warning, pl-16, text-2 italic, bg warning/5

Math (KaTeX): standard inline and block rendering
```

**Previous explanations (collapsible at bottom):**
```
Trigger: "↓ 2 Previous Explanations" — 13px text-3 link, mt-32
Expanded: list of cards
  Each: border, rounded-12, padding 12px 16px, bg surface
  Row: date-time 12px text-3 + config badges (length pill + depth pill) + "View →" link
```

---

### 6. MIND MAP

Full-bleed (height: 100%, width: 100%, no outer padding)

**Floating toolbar (top center of canvas):**
```
Position: absolute top-16 left-50% transform-translateX(-50%)
Card: rounded-16, bg rgba(255,255,255,0.92) dark:rgba(15,24,41,0.92)
      backdrop-blur-16, border, shadow-md, padding 10px 16px
Display: flex, align-items center, gap 12px

Complexity pills: "BASIC" | "ADVANCED" — toggle pill group, 32px height
Detail pills: "BRIEF" | "DETAILED" — same

Divider: 1px vertical border, height 24px

Generate button: primary gradient, Sparkles icon, "Generate" text, 36px height rounded-10
  If map rendered: "↺ Re-generate" (secondary style)

Divider

Icon buttons (36×36, rounded-10, border, surface-2 bg, hover primary-50):
  ZoomIn | ZoomOut | Maximize2 (fit) | Download (PNG) | Clock (history)
```

**Canvas area:**
```
Background: #F8FAFF with subtle dot grid:
  SVG pattern: circles r=0.5, fill #C7D2FE, spacing 24px, opacity 40%

SVG tree centered:
  Pan: drag to pan
  Zoom: scroll wheel, 0.2×–3× range
  Node interactions: hover → tooltip with description

ROOT NODE (220×80):
  Rounded-16, fill: gradient (primary-500 → violet-500)
  Text: white, 16px Inter 700, centered
  Shadow: glow
  Stroke: none

BRANCH NODES (180×64):
  Rounded-12, fill based on type:
    CONCEPT: surface bg, border 1.5px primary-200
    EXAMPLE: amber-50 bg, border amber-200
    FACT:    green-50 bg, border green-200
  Text: 13px Inter 600 text-1, centered (2-line clamp)
  Hover: scale 1.04, shadow-md, transition 200ms

EDGES:
  Cubic bezier curves, stroke: border color (#C7D2FE light / rgba(148,163,184,0.25) dark)
  stroke-width: 2, fill: none
  Root to child: primary-300/50 stroke

TOOLTIP (on node hover):
  Absolute positioned below node
  Rounded-10, bg slate-900, text white 12px
  padding 8px 12px, shadow-lg, max-width 200px
  Content: node description text
```

**History drawer:**
```
Width 280px, slides in from right
Header: "Saved Maps" 16px bold + X button
List items: border-b, padding 16px
  Date: 13px text-2
  Config badges: complexity + detail pills (11px)
  "Load" button: primary text, 13px
Empty: "No saved maps yet" 13px text-3 centered
```

---

### 7. ACTIVE RECALL

Max-width 600px, centered, padding-y 80px

**Progress bar:** full-width, 6px, rounded-pill, primary-500 fill, animated width

**"Concept 2 of 6" text:** 13px text-3, mt-8 mb-32

**Question card:**
```
rounded-20, bg surface, border, shadow-lg, padding 40px

Concept badge: pill, primary-100 bg, primary-700 text, 13px uppercase, mb-20

Question text: "What can you tell me about [Concept Title]?"
  22px Instrument Serif, text-1, line-height 1.5

Textarea:
  mt-24, full-width, min-height 120px, rounded-12
  bg surface-2, border, focus ring primary-500/20
  15px Inter 400 text-1, padding 14px 16px
  placeholder: "Write everything you know about this concept…"
  resize: vertical

"Show Answer" button:
  mt-20, full-width, 44px, rounded-10
  secondary style: border primary-200, bg primary-50 hover:bg primary-100
  ChevronDown icon + "Reveal Answer" text
```

**Answer reveal (slides down, 300ms):**
```
mt-20, pt-20, border-top border

"CORRECT ANSWER" label: 10px uppercase text-3, mb-12

Answer text: 16px Inter 400 text-2, line-height 1.7
  Rendered via MarkdownRenderer

mt-28, two buttons (full-width, gap 12px, flex column):
  "I got it! ✓": 44px, rounded-10, bg success, white text, shadow-glow-success
    Inter 600, CheckCircle icon left
  "Need more practice": 44px, rounded-10, bg surface, border, text-2
    RotateCcw icon left, "I need more practice"
```

---

### 8. FLASHCARDS

Max-width 480px, centered, padding-y 48px

**Header:**
```
"Flashcards" 22px Instrument Serif bold + "{n} cards" badge (surface-2 pill)
Right: "＋ Add Card" (secondary btn 36px) + "✨ AI Generate" (primary btn 36px)
mt-4: "{chapter.title}" 13px text-3
```

**Progress row:**
```
mt-20
"Card 4 of 12" 13px text-3 left
Dot indicators right: filled primary-500 (current), filled primary-200 (seen), border only (remaining)
Max 8 dots shown, "+4" if more
```

**3D Flashcard:**
```
mt-20, full-width, height 240px
perspective: 1000px (wrapper)
transform-style: preserve-3d (card)
transition: rotateY 400ms ease-in-out

FRONT FACE:
  position absolute, full size
  rounded-20, bg gradient (primary-500 → violet-600)
  padding 28px
  "FRONT" — 10px uppercase tracking-wider, white/70, top-left
  Question text — 20px Inter 600 white, centered (vertical + horizontal), max 3 lines
  backface-visibility: hidden

BACK FACE:
  position absolute, full size, rotateY 180deg
  rounded-20, bg surface, border 2px primary-200
  padding 28px
  "BACK" — 10px uppercase tracking-wider, text-3, top-left
  Answer text — 15px, text-2, centered, MarkdownRenderer
  backface-visibility: hidden

Tap/click area: entire card, cursor pointer
"Tap to flip" hint: 11px text-3 below card
```

**Rating buttons (slide up after flip, stagger 50ms each):**
```
mt-16, flex row, gap 8px, full-width

Again: flex-1, 40px, rounded-10, bg red-50, border red-200, text red-600, Inter 600
Hard:  flex-1, bg amber-50, border amber-200, text amber-700
Good:  flex-1, bg green-50, border green-200, text green-700
Easy:  flex-1, bg primary-50, border primary-200, text primary-700

Slide-up animation: translateY(16px)→0, opacity 0→1, stagger 50ms
```

**Empty state:**
```
Centered, py-64
Brain icon SVG 64px, primary-200 color
"No flashcards yet" 18px Instrument Serif text-2, mt-16
"for {chapter.title}" 14px text-3, mt-4
mt-24, two buttons:
  "✨ Generate with AI" — primary full-width 44px
  "Create manually" — secondary full-width 40px, mt-8
```

**Create form:**
```
Replaces card area, animate slide-in
"Create New Flashcard" 18px bold, mb-20

"Front (Question):" label, textarea 3 rows, rounded-12
"Back (Answer):" label, textarea 3 rows, rounded-12
mt-16, "Save Card" primary 44px + "Cancel" ghost btn, gap 8px
```

---

### 9. DOUBT SOLVER (AI Chat)

Full-height flex column layout (no outer scroll)

**Sticky header:**
```
Height 60px, border-bottom, bg surface/90% backdrop-blur-12
padding 0 20px
Left: "AI Tutor" 16px Inter 700 + "Physics · Motion & Newton's Laws" 12px text-3 below
Right: "Clear Chat" ghost button — Trash2 icon 16px + text 13px text-3
       hover: text-red-500 border-red-200
```

**Messages area (flex-1, overflow-y-auto):**
```
padding 20px (mobile 16px)
scroll-smooth, overscroll-contain

AI MESSAGE:
  flex row, gap 10px, mb-20
  Avatar: 32px circle, gradient bg (primary-500→violet-500), Bot icon white
  Bubble: bg surface-2, border 1px border, rounded-16 rounded-tl-4
    padding 12px 16px, max-width 85%
    MarkdownRenderer: 14px text-2, line-height 1.7
  Timestamp: 11px text-3, mt-4 ml-42 (below bubble)
  Cache badge (if cached): flex row gap-4, mt-4 ml-42
    Zap icon 12px emerald-500 + "Instant — answered from cache" 11px emerald-600

USER MESSAGE:
  flex row-reverse, gap 10px, mb-20
  Avatar: 32px circle, surface-2 bg, border, User icon text-3
  Bubble: bg slate-100 dark:bg-slate-800, rounded-16 rounded-tr-4
    padding 12px 16px, max-width 85%
    14px text-1 Inter 400

TYPING INDICATOR:
  Same as AI message layout
  Bubble contains: 3 circles (8px, bg text-3/40)
    Animate up/down, stagger 200ms each, loop infinite
```

**Input bar (sticky bottom):**
```
Height 72px, border-top, bg surface, padding 12px 16px

Inner container:
  full-width, rounded-12, bg surface-2, border, padding 6px 6px 6px 16px
  flex row align-center gap 8px
  focus-within: border-primary-300, ring-2 ring-primary-500/15

Text input:
  flex-1, bg transparent, border none, outline none
  15px Inter 400 text-1, placeholder text-3
  placeholder: "Ask anything about {chapter}…"

Send button:
  36px circle, bg primary-600, hover bg primary-700
  Send icon 16px white
  disabled: opacity-50
  transition 150ms
```

---

### 10. QUIZ

Max-width 680px, centered

**TYPE SELECTOR screen:**
```
"Choose Quiz Type" 28px Instrument Serif bold, mb-8
"Questions are generated fresh every time from your chapter" 15px text-3, mb-32

2×2 grid, gap 12px:
  Each type card: rounded-16, border, padding 20px, cursor-pointer
  hover: border-primary-300, shadow-md, translateY(-2px)
  selected: border-primary-500, bg primary-50, shadow-glow

  MCQ card:
    ListChecks icon 32px primary-500 in primary-100 rounded-12 box (48px)
    "Multiple Choice" 16px bold, mt-12
    "Pick the correct option from 4 choices" 13px text-3, mt-4

  FIB card:
    Pen icon 32px violet-500 in violet-100 rounded-12 box
    "Fill in the Blank"
    "Complete the sentence with the right word"

  MATCH card:
    Shuffle icon 32px amber-600 in amber-100 rounded-12 box
    "Match the Following"
    "Connect 3 pairs on the left to the right"

  MIXED card:
    AlignLeft icon 32px green-600 in green-100 rounded-12 box
    "Mixed"
    "Combination of all three types"

Question count stepper (below grid, mt-24):
  "Number of Questions" 13px text-3 label
  mt-8: Minus button (36×36 rounded-10 border) | count badge (primary-50 bg, "10", 18px bold) | Plus button
  Buttons: hover bg primary-50, active scale 0.95

Start button:
  mt-24, full-width, 48px, rounded-10, primary gradient
  "Start Quiz" Inter 600 15px + ChevronRight icon

Recent scores (collapsible, mt-32):
  "↓ Recent Scores" trigger 13px text-3
  Expanded list: each row border-b, padding 12px 0
    Date 12px text-3 + type badge + "7 / 10" score + "+70 pts" amber badge
```

**QUESTION screen:**
```
Progress header:
  "Q 3 of 10" 13px text-3 + progress bar (6px, primary fill, mt-4)
  Timer: Clock icon 14px + elapsed time 13px text-3, right

Question card (mt-16):
  rounded-20, border, padding 28px 32px, bg surface, shadow-md

  MCQ:
    Question text — 20px Inter 600 text-1, MarkdownRenderer (KaTeX), mb-24
    4 option buttons (full-width, mb-8 each):
      Height 52px, rounded-12, border, bg surface, text-left padding 14px 18px
      Option letter badge (A/B/C/D): 26px circle, surface-2 bg, 13px text-3 bold, mr-12
      Option text: 15px text-1
      Hover: border-primary-300, bg primary-50/50
      Selected: border-primary-500, bg primary-50
      Correct reveal: border-green-400, bg green-50, letter badge turns green-500
        CheckCircle2 icon 18px green-500, right side
      Wrong reveal: border-red-300, bg red-50, letter badge turns red-400
        XCircle icon 18px red-400, right side

  FIB:
    Question text 20px mb-24 (blank shown as "______")
    Input: full-width, 52px, rounded-12, border, 18px, padding 14px 18px
    "Check Answer" button: primary 44px, full-width, mt-12
    Correct: green border, CheckCircle icon inside right + confetti burst
    Wrong: red border + "Correct answer: {answer}" shown in green-50 card below

  MATCH:
    Three pair rows (gap 12px):
      Left label: pill, 15px, border, rounded-pill, bg surface-2, padding 10px 18px
      Arrow: "→" text-3 mx-12
      Right option: same pill style but clickable, options shown as buttons
      Matched correct: both pills turn green-100 + green-300 border
      Matched wrong: both turn red-50 + red-200 border

  "Next Question →" button (mt-24, right-aligned):
    primary 44px rounded-10
    enabled only after answering
```

**SCORE screen:**
```
Centered, py-64
Trophy icon 72px: gradient fill (amber-400→amber-600) in amber-100 rounded-24 glow box
  Confetti burst animation on enter (particles: primary, amber, green, violet colors)

"{X} / {Y}" — 56px Instrument Serif bold, mt-20
"{P}%" — 32px, color: green-600 if >70%, amber-600 if 40-70%, red-500 if <40%

"+{n} points earned!" badge:
  mt-20, inline-flex, amber-100 bg, amber-700 text, border amber-200
  Star icon 16px amber-500 mr-8 + text 16px Inter 700
  Spring animation: scale 0 → 1.1 → 1, 400ms on enter

Two buttons (mt-32, flex gap-12):
  "Play Again" — outline, full-width 44px
  "Back to Chapter" — primary gradient, full-width 44px
```

---

### 11. LEADERBOARD

Max-width 680px, centered, py-48

**Header:**
```
Centered
Trophy icon: 56px, gradient amber fill, in 80px rounded-20 amber-100 box, shadow-glow-amber
"Leaderboard" 36px Instrument Serif bold text-1, mt-16
"Top students by quiz points" 15px text-3, mt-4

Your rank badge (if user is ranked):
  mt-16
  "You're ranked #4" — pill, primary gradient bg, white text, Star icon left
  Inter 700 15px, padding 10px 20px, shadow-glow
```

**Top 3 podium row (mt-32):**
```
3 cards side by side, centered, gap 12px, max-width 500px

#2 card (left, 120px wide, 150px tall):
  rounded-20, silver gradient bg (slate-100→slate-200), border slate-300
  Avatar 44px circle (initials + gradient bg), mt-16, centered
  Name: 13px bold, text-1, mt-8, text-center
  Points: 12px text-3, mt-4
  "🥈" emoji 20px, bottom center, mb-12

#1 card (center, 140px wide, 180px tall, elevated):
  rounded-20, gold gradient bg (#FEF3C7→#FDE68A), border amber-300, shadow-lg
  Avatar 52px, mt-16, centered, ring-2 ring-amber-400
  Name: 14px bold, mt-8
  Points: 13px amber-700
  "🥇" 24px, mb-16
  Crown icon or star-burst behind avatar (decorative, amber-400/20)

#3 card (right, 120px wide, 150px tall):
  rounded-20, bronze gradient (#FED7AA→#FDBA74), border orange-300
  Avatar 44px, mt-16
  Name: 13px bold
  Points: 12px text-3
  "🥉" 20px, mb-12
```

**Rank list (4–50, mt-24):**
```
Each row: rounded-14, 60px tall, border, bg surface, mb-6
Padding: 0 16px, flex row align-center gap 12px

Rank #: 24px wide, 15px Inter 800 text-3 (or medal icon for 1-3)
Avatar: 40px circle, initials fallback, gradient bg (user-seeded color)
Name: 15px Inter 600 text-1 flex-1
Grade badge: "Class 9" — 11px, surface-2 bg, text-3, pill
Points: "1,240 pts" — 13px Inter 600 primary-600 (light) / primary-400 (dark)

CURRENT USER ROW:
  bg primary-50 dark:primary-900/20
  border primary-200 dark:primary-800
  "You" badge: 11px uppercase primary-100 bg primary-600 text, pill, after name
```

---

### 12. COMMUNITY

Max-width 860px

**Header:**
```
"Classmates" 28px Instrument Serif bold
"Class 9 · CBSE" 14px text-3, mt-4
Notification bell (top-right): Bell icon 22px text-2
  Red dot badge (8px) if pending requests > 0
```

**Tab bar (mt-20):**
```
3 tabs: "Explore" | "Requests 2" | "Friends 5"
Style: underline tabs
Tab: 15px Inter 500, padding 0 4px pb-12, text-3 (inactive) / text-1 (active)
Active indicator: 2px primary-500 bottom border
Badge on Requests: 18px pill, primary-600 bg, white text, 11px (shows count)
Divider line: 1px border, full-width below tabs
```

**EXPLORE tab:**
```
Search bar (mt-16):
  Full-width, 44px, rounded-12, bg surface-2, border
  Search icon 18px text-3 leading, padding-left 42px
  placeholder: "Search by name…"

Grid (mt-16): 2 cols desktop, 1 col mobile, gap 12px

STUDENT CARD:
  rounded-16, border, bg surface, padding 16px
  hover shadow-sm, hover border-primary-200, transition 150ms

  TOP ROW:
    Avatar: 48px circle, gradient bg (user-seeded), initials white Inter 700 18px
    OR img if avatar_url set
    right of avatar:
      Name: 15px Inter 700 text-1
      Grade badge: "Class 9" pill, 11px, surface-2

  Hobbies (mt-8):
    "Cricket, Drawing, Coding" 13px text-3 italic, max 2 lines clamp

  Action button (mt-12, full-width, 36px):
    "Send Request": outline primary, UserPlus icon 16px, 13px Inter 600
    "Request Sent ✓": ghost, disabled, Check icon, text-3
    "Friends ✓": success bg green-50, border green-200, text green-700, UserCheck icon
    "Incoming ↓": amber-50 bg, amber-600 text, "Wants to connect"
```

**REQUESTS tab:**
```
List of incoming requests (gap 12px)

REQUEST CARD:
  rounded-16, border, bg surface, padding 16px

  TOP ROW: Avatar 44px + Name 15px bold + "wants to connect" 13px text-3
  
  Reason message (if present, mt-8):
    rounded-10, bg surface-2, border-l-3 border-primary-300
    padding 10px 14px
    italic 13px text-2

  Action row (mt-12, gap 8px):
    "Accept" btn: green-50 bg, border green-200, text green-700, Check icon, flex-1
    "Decline" btn: ghost, text-3, X icon, flex-1

  Decline expanded (animated height):
    Textarea: 3 rows, placeholder "Reason (optional)…", rounded-10, border, surface-2 bg
    mt-8: "Send decline" btn (red-50 bg, red-600 text, border red-200) + "Cancel" ghost

EMPTY: centered "No pending requests" 14px text-3
```

**FRIENDS tab:**
```
Same grid as Explore
Student card but:
  Bottom: "Friends since Apr 2025" 12px text-3 (clock icon prefix)
  No action button
  Subtle green-50 left border 2px

EMPTY: centered "No friends yet. Explore classmates →" with link
```

**Toast (top-right, z-50):**
```
rounded-12, bg slate-900, text white, border primary-500/30, shadow-lg
padding 12px 16px
flex row gap 10px
Left: icon 18px (primary-400 or success)
Message: 14px Inter 500 white
Right: X close button
Bottom: progress bar (full-width, 3px, primary-500, shrinks 3s linear)
Enter: translateX(120%)→0, 250ms spring
```

---

### 13. PROFILE

Max-width 680px, centered, py-48

**Avatar section (centered, mb-32):**
```
Avatar container: position relative, width 96px, mx-auto
  Image: 96px circle, shadow-lg, object-cover
  Fallback: 96px circle, gradient bg, 36px initials white Inter 700

  Upload overlay (visible on hover):
    Position absolute, inset-0, rounded-full
    bg rgba(0,0,0,0.50)
    Camera icon 24px white centered
    "Change" text 11px white below icon
    cursor pointer, transition 200ms

  Drag-over state:
    Ring: 3px dashed primary-400 on container
    Overlay: bg primary-500/20 + "Drop to upload" text white

  Uploading state:
    Circular spinner overlay, bg rgba(0,0,0,0.40)
    Spinner: 32px, white, centered

Upload error (below avatar):
  mt-8, red-50 bg, border red-200, rounded-10, padding 8px 12px
  AlertCircle icon 14px red-500 + error text 12px red-700

Name: "Manthan K." 24px Instrument Serif bold text-1, mt-16 text-center
Email: Mail icon 14px text-3 + email 14px text-3, text-center, mt-4
Points badge: mt-12, amber-100 bg, amber-700 text, Star icon 14px filled amber-400
  "{n} quiz points" Inter 600 14px, "View ranking →" 12px text-3 ml-8 link
```

**Form card (mt-28):**
```
rounded-20, border, bg surface, padding 28px 32px

"Saved ✓" indicator (top-right corner, absolute):
  Animate: opacity 0 → 1 → 0 (stays visible 2s, then fades)
  Check icon 14px green-500 + "Changes saved" 12px green-600

Fields (gap 20px flex column):

  Full Name:
    Label: "FULL NAME" 10px uppercase text-3 tracking-wider, mb-6
    Input: 44px, rounded-10, border, bg surface-2
    User icon 16px text-3 leading, padding-left 40px
    Profanity error: mt-4, 12px red-500, AlertCircle icon prefix

  Grade:
    Label: "CLASS / GRADE"
    Select: 44px, rounded-10, bg surface-2, BookOpen icon leading
    Options: Class 6 – Class 10

  Hobbies & Interests:
    Label: "HOBBIES & INTERESTS"
    Textarea: 3 rows, rounded-12, bg surface-2
    Smile icon 16px top-left (inside, absolute top-12 left-12)
    placeholder: "e.g. cricket, drawing, coding, music…"
    Profanity error same as above
```

---

### 14. CONFIG ERROR SCREEN

Full-screen, bg surface, flex center

```
Card: max-width 520px, rounded-20, border, bg surface, padding 40px, shadow-lg, text-center

Icon container: 80px circle, amber-100 bg, amber-50 ring-4
  AlertTriangle icon 40px amber-600

"Configuration Required" 28px Instrument Serif bold, mt-20
Body text 15px text-2, mt-8, max-width 360px, centered

Status checklist (mt-24):
  rounded-12, bg surface-2, border, padding 16px 20px, text-left
  Two rows (gap 8px):
    Dot (8px circle): red-500 (missing) | green-500 (present) | slate-300 (server-side)
    + label text 14px text-2

Footer 12px text-3, mt-20:
  "After adding the keys, redeploy or refresh the page."
```

---

## Responsive Design Requirements

**Breakpoints:**
- Mobile: 390px (iPhone 14)
- Tablet: 768px
- Desktop: 1440px

**Key mobile adaptations:**
- Sidebar: hidden, slides in as bottom-anchored drawer (80% height) on mobile hamburger tap
- Mobile header: 56px fixed bar, bg surface/90% blur, hamburger + title + points
- Grid layouts: 3-col → 1-col
- Leaderboard podium: stacked vertically on mobile
- Quiz type selector: 2×2 grid → 2×2 grid (same, just smaller cards)
- Auth: right panel only (left panel collapses to logo strip)
- DoubtSolver input: fixed above keyboard using `env(safe-area-inset-bottom)`
- Tap targets: minimum 44×44px

---

## What to Deliver

1. **Component library frame** — all shared components: buttons, inputs, badges, cards, skeletons, toasts, segmented controls
2. **All 14 screen designs** (listed above) in light mode at desktop size
3. **Dark mode variants** for: Auth, Sidebar, Breakdown, Doubt Solver, Leaderboard
4. **Mobile variants** for: Auth, Subject Selection, Chapter Breakdown, Doubt Solver
5. **Interactive prototype** connecting: Home → Chapter Breakdown → Doubt Solver → Quiz → Score screen
6. **Design token file** documenting all colors, spacing, typography, radius, shadows

**CRITICAL: Do NOT remove any feature. Do NOT change any workflow. ONLY improve the UI layer.**
