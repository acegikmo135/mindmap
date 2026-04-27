# CogniStruct — Stitch Design Prompts

> Stitch by Google generates UI components from natural language prompts.
> Each section below is a **standalone Stitch prompt** for a specific screen or component.
> Paste each prompt separately into Stitch. After generation, export as React/Tailwind.

---

## How to use this file

1. Open **Stitch** (stitch.withgoogle.com or Firebase Stitch)
2. Copy one prompt block at a time
3. Paste into Stitch's prompt field
4. Review + iterate with follow-up prompts
5. Export generated code as React + Tailwind
6. Map to the existing CogniStruct component file (mapping listed per prompt)

**Target export stack:** React (TypeScript) + Tailwind CSS

---

## Design System Reference (give to Stitch in every session)

```
Before generating, apply this design system:

FONTS: Display = Instrument Serif (headings), UI = Inter (body), Code = JetBrains Mono
COLORS:
  Brand: primary-500 = #6366F1 (indigo), violet = #8B5CF6, success = #10B981, warning = #F59E0B, danger = #EF4444
  Light bg: #F8FAFF, surface: #FFFFFF, surface-2: #F1F5FE, border: #E4EAF6
  Dark bg: #060C17, dark surface: #0F1829, dark surface-2: #162035
  Text: heading #0F172A, body #475569, muted #94A3B8
RADIUS: buttons/inputs 10px, cards 16px, large 20px, pill 9999px
SHADOWS: cards use "0 4px 16px rgba(0,0,0,0.08)", primary glow "0 4px 24px rgba(99,102,241,0.30)"
SPACING: 8px grid (8, 16, 20, 24, 32, 40, 48)
STYLE: Premium SaaS, clean minimal, soft gradients (indigo→violet), smooth transitions 150-250ms
```

---

## Prompt 1 — AUTH SCREEN (Full Page)

**Maps to:** `components/Auth.tsx`

```
Design a full-page authentication screen for "CogniStruct", an AI study app for students.

Apply the design system above.

LAYOUT: Two-panel split on desktop (60% left dark / 40% right light), single card centered on mobile.

LEFT PANEL (desktop only):
- Dark background gradient from #060C17 to #0F1829
- At top center: a 48px square icon with indigo-to-violet gradient and a brain SVG icon in white, followed by "CogniStruct" in Instrument Serif 32px white bold
- Italic tagline below: "Your AI study companion" in slate-400 color
- A vertical list of 6 features below (each row: colored icon + text): "AI Mind Maps", "Instant Doubt Solver", "Smart Quizzes", "Spaced Flashcards", "Leaderboard", "Study Community"
- At bottom: a pill badge "For Class 6–10 · CBSE, ICSE & State Boards" in indigo-900/50 background and indigo-300 text
- Two decorative blurred gradient circles floating in background (indigo and violet, 300px, low opacity)

RIGHT PANEL:
- White background
- Centered card (max 400px wide, 40px padding, 24px border-radius, shadow)
- "Welcome back" heading in Instrument Serif 28px bold
- "Don't have an account? Sign up →" subtitle with link in indigo-600
- Email input field: 44px height, rounded-10, with mail icon on left, label "Email address"
- Password input field: same with lock icon left and eye toggle right
- "Forgot password?" right-aligned link below password
- "Sign In" button: full-width 44px, indigo-to-violet gradient background, white text Inter 600 15px, with box-shadow glow
- "— or —" divider
- "Continue with Google" button: white bg, 1px border, Google SVG icon, 44px height
- Smooth card-flip animation to switch between Sign In and Sign Up states

Include a loading state (spinner on button) and error state (red alert card above form).
Include email sent confirmation state (envelope icon, "Check your email" message, no form shown).
Support dark mode.
```

---

## Prompt 2 — SIDEBAR

**Maps to:** `components/Sidebar.tsx`

```
Design a fixed left sidebar for "CogniStruct" app. Width 240px, full viewport height, white background, right border 1px #E4EAF6.

Apply the design system above.

STRUCTURE (top to bottom as flex column):

LOGO SECTION (72px tall, padding 0 16px):
- 32×32 rounded-12 box with indigo-to-violet gradient + white brain icon inside
- "CogniStruct" text in Inter 600 18px dark text
- Clicking this navigates home

CHAPTER CONTEXT (conditional, only when chapter is active):
- Small pill chip: chapter title text (truncated) + subject badge
- Background: indigo-50, text indigo-700, border-radius pill
- "← Subjects" text button below (13px, slate-400, hover slate-700)

TOOLS SECTION LABEL:
- "TOOLS" in 10px uppercase letter-spacing-wider slate-400, padding 12px 16px 4px

TOOL NAV ITEMS (8 items, scroll if overflow):
Items in order: Breakdown, Understand Chapter, Mind Map, Active Recall, Flashcards, Doubt Solver, Revision Mode, Quiz
Each item: 40px height, 10px border-radius, padding 0 12px, flex row, gap 10px
- Icon: 18×18 Lucide icon, slate-400 color (inactive), indigo-500 (active)
- Label: 14px Inter 500, slate-500 (inactive), indigo-700 (active)
- Active state: indigo-50 background, 2px left border indigo-500
- Hover: surface-2 background, 150ms transition

ADMIN ITEM (conditional, only if is_admin):
- Separator line above
- BarChart3 icon + "Teacher View" label, slate tones

BOTTOM SECTION (mt-auto, border-top, padding 16px 8px):
- POINTS WIDGET: rounded-12 card, amber-50 background, amber-100 border, flex row
  Star icon (filled amber-400) + "1,240 pts" bold text + "View ranking →" small text right
  Full-width, click navigates to Leaderboard

- THEME TOGGLE: 3-button segmented control in surface-2 background pill
  Sun (Light) | Moon (Dark) | Book (Reading mode)
  Active button: white background with shadow

- 4 nav items: Select Subject (BookOpenText icon) | Leaderboard (Trophy) | Classmates (Users) | Profile (User)
  Same anatomy as tool items above

- Sign Out: LogOut icon + "Sign Out" text, hover red-50 bg red-600 text

MOBILE BEHAVIOR:
On screens under 768px, sidebar is hidden by default. Sliding in from left with overlay backdrop when triggered. Show X close button top-right of sidebar on mobile.
```

---

## Prompt 3 — SUBJECT SELECTION (Home / Chapter Library)

**Maps to:** `components/SubjectSelection.tsx`

```
Design the home screen / chapter library for "CogniStruct" student study app.

Apply the design system above.

PAGE:
Background #F8FAFF, max-width 1200px centered, padding 48px 32px

HEADER:
- Greeting: "Good morning, Manthan 👋" in Instrument Serif 32px bold
- Subtitle: "Which chapter are you studying today?" in 17px slate-500
- Top-right button: "+ Start new chapter" with indigo gradient, Plus icon, 40px height, 10px rounded

CHAPTER GRID:
- 3 columns desktop, 2 tablet, 1 mobile, gap 16px
- Show 6 example chapter cards + 1 "add" card

CHAPTER CARD (for each chapter):
White background, 1px #E4EAF6 border, 16px border-radius, 20px padding
On hover: shadow-md, lift 2px, border indigo-200, 200ms transition

Inside the card:
- Top row: colored subject badge pill (11px uppercase) + "2 days ago" small text right
- Chapter title: "Photosynthesis" — 16px Inter 700, max 2 lines
- Progress bar: 4px tall, rounded-pill, indigo-500 fill, surface-2 track (e.g. 57% filled)
- Below bar: "4 of 7 concepts mastered" — 12px slate-400

Subject badge colors:
- Biology: green-100 bg green-700 text
- Physics: blue-100 bg blue-700 text
- History: orange-100 bg orange-700 text
- Mathematics: amber-100 bg amber-700 text
- Chemistry: violet-100 bg violet-700 text

ADD NEW CHAPTER CARD (last card):
Same size, 1.5px dashed indigo-200 border, transparent bg
Center: Plus icon 24px indigo-300 + "Add new chapter" 14px slate-400
Hover: bg indigo-50, border indigo-400

EMPTY STATE (when no chapters):
Centered in grid area, Book icon 64px slate-200, "No chapters yet" 18px Instrument Serif, subtitle + "Create your first chapter" primary button

Also show the CREATE CHAPTER DRAWER (as a bottom sheet on mobile, right side panel on desktop):
- "New Chapter" heading + X close
- Large text input for topic name with placeholder "e.g. Gravitation, French Revolution..."
- Class select dropdown
- "✨ Generate with AI" primary button full-width
- Loading state: skeleton lines + "AI is structuring your chapter…" text
```

---

## Prompt 4 — CHAPTER BREAKDOWN (Dashboard)

**Maps to:** `components/ChapterBreakdown.tsx`

```
Design the chapter breakdown / dashboard screen for "CogniStruct" study app.

Apply the design system above.

MAX-WIDTH 860px centered.

STICKY HEADER:
- Breadcrumb: "Science ›" small text + back button (slate-400, 13px)
- Chapter title: "Photosynthesis" in Instrument Serif 30px bold below
- Progress bar: 8px height, rounded-pill, indigo-500 fill, e.g. 57% width
- "4 of 7 concepts mastered" 13px slate-400 below bar
- Row of 6 icon shortcut buttons (36×36 each, 10px rounded, surface-2 bg, border):
  BookOpenText | Network | BrainCircuit | Library | MessageCircleQuestion | Trophy
  Hover: indigo-50 bg, indigo-200 border

CONCEPTS LIST:
- Section label: "CONCEPTS" 10px uppercase letter-spacing-wider slate-400, mt-32 mb-12

Show 5 example concept rows:

CONCEPT ROW anatomy:
Full-width, 14px border-radius, border, bg white, padding 16px 20px, mb-8
Flex row, align-items center

Left (40px wide):
- Colored dot 6px circle
- "01" number 11px slate-400 below dot

Center (flex-1):
- Title: 16px Inter 600 slate-900
- Description: 13px slate-500 mt-4, max 2 lines
- "~12 min" with clock icon 11px slate-400 mt-4

Right:
- Status badge: pill 11px uppercase
- "Start Learning →" button (hidden by default, slides in on row hover): primary bg, 13px Inter 600, 32px height

4 STATUS STYLES:
1. LOCKED: row opacity-50, "Locked" badge slate-100 bg slate-500 text with Lock icon
2. NOT_STARTED: default, "Not Started" badge slate-100 bg slate-500 text
3. IN_PROGRESS: left border 2px indigo-500, indigo-50/50 bg tint, dot is indigo-500 with pulse animation, "In Progress" badge indigo-100 bg indigo-700 text
4. MASTERED: left border 2px green-500, green-50/40 bg tint, dot is green-500, "Mastered ✓" badge green-100 bg green-700 text with checkmark

Show all 4 status variants in the demo (at least one of each).
```

---

## Prompt 5 — DOUBT SOLVER / AI CHAT

**Maps to:** `components/DoubtSolver.tsx`

```
Design a full-height AI tutor chat interface for "CogniStruct" study app.

Apply the design system above.

LAYOUT: Full viewport height, flex column, no outer scroll.

HEADER (sticky top, 60px tall):
- Left: "AI Tutor" 16px Inter 700 + "Physics · Motion & Newton's Laws" 12px slate-400 below
- Right: "Clear Chat" button with Trash2 icon + text, 13px slate-400, hover text-red-500 border-red-200
- White background 90% opacity + backdrop-blur
- Border-bottom 1px #E4EAF6

MESSAGES AREA (flex-1, overflow-y-auto, padding 20px):
Show 3 messages alternating AI and user:

AI MESSAGE:
- Flex row with gap
- Avatar: 32px circle, indigo-to-violet gradient bg, white Bot icon inside
- Bubble: right of avatar, surface-2 bg (#F1F5FE), 1px border, rounded-16 rounded-tl-4, padding 12px 16px, max-width 85%
- Text inside: 14px Inter 400, slate-600, line-height 1.7, support bold and markdown
- Timestamp below bubble: 11px slate-400
- "Instant ⚡" badge (optional): emerald-500 text, Zap icon, 11px, below timestamp

USER MESSAGE:
- Flex row-reverse with gap
- Avatar: 32px circle, slate-100 bg border, User icon slate-400
- Bubble: right side (visually left because row-reverse), slate-100 bg dark:slate-800, rounded-16 rounded-tr-4
- Text: 14px Inter 400 slate-900

TYPING INDICATOR (show one as demo):
- Same AI avatar + bubble containing 3 dots (8px circles, slate-400, bounce animation staggered 200ms)

INPUT BAR (sticky bottom, 72px, border-top, white bg):
- Inner container: rounded-12, surface-2 bg, 1px border, flex row, padding 6px
- focus-within: indigo-300 border + ring-2 ring-indigo-500/15
- Placeholder text input: flex-1, bg transparent, 15px, "Ask anything about Newton's Laws…"
- Send button: 36px circle, indigo-600 bg, Send icon white, hover indigo-700

Show light and dark mode variants.
Mobile: same layout, just narrower with 16px padding.
```

---

## Prompt 6 — FLASHCARDS

**Maps to:** `components/Flashcards.tsx`

```
Design the flashcard study screen for "CogniStruct" study app.

Apply the design system above.

MAX-WIDTH 480px centered, padding 48px 16px.

HEADER ROW:
- Left: "Flashcards" 22px Instrument Serif bold + "12 cards" pill badge (surface-2 bg, 13px)
- Below: "Photosynthesis" 13px slate-400
- Right: "+ Add Card" button (outline secondary, 36px) + "✨ AI Generate" (indigo gradient, 36px)

PROGRESS ROW (mt-20):
- Left: "Card 4 of 12" 13px slate-400
- Right: dot indicators — show 8 dots: 1 filled indigo-500 (current), 3 filled indigo-200 (seen), 4 ring-only (remaining)

3D FLASHCARD (mt-20, full-width, height 240px):
Show the FRONT FACE as default:
- 20px border-radius
- Indigo-to-violet gradient background
- "FRONT" label: top-left, 10px uppercase tracking-wider white/70
- Question text centered (vertical + horizontal): "What is the primary pigment used in photosynthesis?" 20px Inter 600 white
- Below card: "Tap to flip" hint text 11px slate-400

Also show BACK FACE state (second artboard):
- White background, 2px border indigo-200
- "BACK" label top-left 10px uppercase text-muted
- Answer text centered: "Chlorophyll — the green pigment found in chloroplasts that absorbs sunlight" 15px slate-600
- Below card: 4 rating buttons row:
  "Again" (red-50 bg, red-600 text, red-200 border, flex-1)
  "Hard" (amber-50 bg, amber-700 text)
  "Good" (green-50 bg, green-700 text)
  "Easy" (indigo-50 bg, indigo-700 text)
  All: 40px height, 10px rounded, Inter 600

EMPTY STATE (third artboard):
Centered: Brain icon 64px indigo-200 + "No flashcards yet" 18px Instrument Serif + "for Photosynthesis" 14px slate-400
Two buttons below: "✨ Generate with AI" (primary, full-width 44px) + "Create manually" (outline, full-width 40px)
```

---

## Prompt 7 — QUIZ (Type Selector + Question + Score)

**Maps to:** `components/Quiz.tsx`

```
Design 3 quiz screen states for "CogniStruct" study app.

Apply the design system above. Max-width 680px centered.

STATE 1 — TYPE SELECTOR:
- "Choose Quiz Type" 28px Instrument Serif bold
- "Fresh questions generated every time from your chapter" 15px slate-400, mt-4
- 2×2 grid of type cards (mt-24, gap 12px):
  Each card: 16px rounded, 1px border, 20px padding, cursor pointer
  Hover: border-indigo-300 shadow-md lift-2px
  
  Card 1 (MCQ): ListChecks icon 32px in 48px indigo-100 box (14px rounded) + "Multiple Choice" 16px bold + "Pick the correct option from 4 choices" 13px slate-400
  Card 2 (FIB): Pen icon in violet-100 box + "Fill in the Blank" + description
  Card 3 (MATCH): Shuffle icon in amber-100 box + "Match the Following" + description
  Card 4 (MIXED): AlignLeft icon in green-100 box + "Mixed" + description

- Question count stepper (mt-24): "Number of Questions" label + [− button] [10 count badge, indigo-50 bg, 18px bold] [+ button]
- "Start Quiz" full-width 48px primary gradient button, mt-24

STATE 2 — MCQ QUESTION:
- Progress: "Q 3 of 10" 13px slate-400 + 6px progress bar 30% fill (mt-4)
- Timer: Clock icon + "0:32" right-aligned
- Question card (mt-16): rounded-20, border, shadow-md, padding 28px 32px
  Question: "Which organelle is responsible for producing ATP in a cell?" 20px Inter 600
  4 option buttons below (full-width, mb-8 each, 52px height, rounded-12):
    Each: letter badge circle (A/B/C/D, 26px, surface-2 bg, bold) + option text 15px
    Show option A as "wrong selected" (red-50 bg, red-300 border, XCircle icon right)
    Show option C as "correct" (green-50 bg, green-400 border, CheckCircle2 icon right)
    Others: default surface bg

STATE 3 — SCORE SCREEN:
- Centered, py-64
- Trophy icon 72px (amber gradient fill) in 100px amber-100 rounded-24 glow box
- "7 / 10" 56px Instrument Serif bold, mt-20
- "70%" 32px green-600, mt-8
- "+70 points earned!" badge: amber-100 bg, amber-700 text, Star icon, 16px Inter 700, spring animation in, mt-20
- Two buttons: "Play Again" outline + "Back to Chapter" primary, gap 12px flex row, mt-32

Show all 3 states as separate artboards.
```

---

## Prompt 8 — LEADERBOARD

**Maps to:** `components/Leaderboard.tsx`

```
Design the leaderboard screen for "CogniStruct" study app.

Apply the design system above. Max-width 680px centered, py-48.

HEADER (centered):
- Trophy icon 56px (amber gradient fill) in 80px rounded-20 amber-100 box with amber glow shadow
- "Leaderboard" 36px Instrument Serif bold, mt-16
- "Top students by quiz points" 15px slate-400, mt-4
- "You're ranked #4 ⭐" pill badge: indigo gradient bg, white Inter 700 15px, mt-16

TOP 3 PODIUM (mt-32):
Show 3 cards side by side, centered, gap 12px:

Rank #2 card (120px wide, 150px tall):
- Rounded-20, silver gradient (slate-100→slate-200), border slate-200
- Avatar circle 44px centered + "Priya K." 13px bold + "2,415 pts" 12px slate-400
- "🥈" emoji 20px at bottom center

Rank #1 card (140px wide, 180px tall, elevated with shadow):
- Rounded-20, gold gradient (#FEF3C7→#FDE68A), border amber-300, shadow-lg
- Avatar circle 52px with ring-2 amber-400 + "Arjun S." 14px bold + "2,840 pts" amber-700
- "🥇" 24px at bottom

Rank #3 card (120px wide, 150px tall):
- Rounded-20, bronze gradient (orange-50→orange-100), border orange-200
- Avatar 44px + "Riya M." + "2,190 pts"
- "🥉" 20px at bottom

RANKED LIST (rows 4–8 for demo, mt-24):
Each row: rounded-14, 60px tall, border 1px #E4EAF6, bg white, mb-6, padding 0 16px
Flex: rank# (24px wide, Inter 800 slate-400) | avatar (40px circle gradient) | name + grade badge | points right

Show row #4 as CURRENT USER:
- indigo-50 bg, indigo-200 border
- "You" 11px uppercase pill indigo-100 bg indigo-700 text, after the name

LOADING STATE (separate artboard):
Show 7 skeleton rows with shimmer animation (gradient sweep: surface-2 → #E4EAF6 → surface-2)

EMPTY STATE:
Centered: "Be the first to earn points!" 18px Instrument Serif + "Take a quiz to get started" 14px slate-400 + "Take a Quiz" primary button
```

---

## Prompt 9 — COMMUNITY

**Maps to:** `components/Community.tsx`

```
Design the community / classmates screen for "CogniStruct" study app.

Apply the design system above. Max-width 860px.

HEADER:
- "Classmates" 28px Instrument Serif bold
- "Class 9 · CBSE" 14px slate-400, mt-4
- Notification bell icon top-right (22px, slate-500) with red 8px dot badge overlay (if requests pending)

TAB BAR (mt-20):
3 underline tabs: "Explore" | "Requests 2" | "Friends 5"
- Active: indigo-500 2px bottom border, text-slate-900 Inter 600
- Inactive: text-slate-400 Inter 500
- Badge on Requests: 18px circle indigo-600 bg white text 11px
- Full-width divider below tabs

EXPLORE TAB:
Search bar: full-width 44px, rounded-12, surface-2 bg, Search icon leading, placeholder "Search by name…"

Student grid (mt-16, 2 cols, gap 12px):
Show 4 student cards:

STUDENT CARD anatomy:
- rounded-16, border, white bg, padding 16px, hover shadow-sm hover border-indigo-200

TOP ROW:
- Avatar: 48px circle with gradient bg (unique per user) + white initials 18px bold
- Right: Name 15px Inter 700 + "Class 9" pill badge (surface-2, 11px)

Hobbies (mt-8): "Cricket, Drawing, Coding" 13px slate-400 italic, max 2 lines

Action button (mt-12, full-width, 36px):
Show 4 states across 4 cards:
1. "Send Request" — outline indigo, UserPlus icon
2. "Request Sent ✓" — ghost disabled, Check icon, slate-400 text
3. "Friends ✓" — green-50 bg green-200 border green-700 text, UserCheck icon
4. "Wants to connect ↓" — amber-50 bg, amber-600 text (incoming request)

REQUESTS TAB (second artboard):
Show 2 request cards:
- Avatar + "Rohan M. wants to connect" 15px bold
- Optional reason in quote block (surface-2 bg, left border indigo, italic 13px)
- Action row: "Accept" (green-50 bg, Check icon) + "Decline" (ghost, X icon)
Show one with decline textarea expanded (surface-2 textarea + "Send decline" red-50 button)

TOAST notification (top-right corner):
- rounded-12, slate-900 bg, white text, indigo-500/30 border
- "✓ Friend request sent!" text + progress bar shrinking at bottom
```

---

## Prompt 10 — PROFILE

**Maps to:** `components/Profile.tsx`

```
Design the user profile screen for "CogniStruct" study app.

Apply the design system above. Max-width 680px centered, py-48.

AVATAR SECTION (centered, mb-32):
- 96px circle avatar image (show a sample user photo or gradient initials "MK")
- Shadow-lg on avatar
- Hover overlay: dark overlay (black/50) + Camera icon 24px white + "Change" text 11px white centered
- Below: "Manthan K." 24px Instrument Serif bold text-1
- Email row: Mail icon 14px slate-400 + "manthan@example.com" 14px slate-400 — NOT editable
- Points badge: Star icon 14px amber-400 + "1,240 quiz points" Inter 600 14px amber-700 in amber-100 pill, border amber-200
- "View ranking →" 12px slate-400 link right of points

FORM CARD:
- rounded-20, border, white bg, padding 28px 32px

"Saved ✓" indicator (absolute top-right of card):
- Check icon 14px green-500 + "Changes saved" 12px green-600
- Show as a visible floating element fading in

FIELDS (gap 20px):

Full Name field:
- Label "FULL NAME" 10px uppercase tracking-wide slate-400, mb-6
- Input: 44px height, rounded-10, border, surface-2 bg
- User icon 16px slate-400 on left (pl-10)
- Value: "Manthan Kansagra"

Grade / Class field:
- Label "CLASS / GRADE"
- Select: 44px, rounded-10, surface-2 bg, BookOpen icon left
- Options: Class 6 through Class 10 (show Class 9 selected)

Hobbies & Interests field:
- Label "HOBBIES & INTERESTS"
- Textarea: 3 rows, rounded-12, surface-2 bg, border
- Smile icon 16px top-left (absolute inside input)
- Value: "Cricket, Drawing, Coding, Music"

Show an UPLOAD ERROR state in a second artboard:
- Red alert below avatar: AlertCircle icon + "Only JPG, PNG, WebP or GIF files are allowed." 12px red-700

Show a DRAG-OVER state in a third artboard:
- Avatar zone has indigo dashed 3px ring + "Drop to upload" white text centered overlay (indigo-500/20 bg)

Dark mode variant (fourth artboard).
```

---

## Prompt 11 — FIRST-LOGIN PROFILE POPUP (Modal)

**Maps to:** `components/ProfilePopup.tsx`

```
Design a first-time profile setup modal popup for "CogniStruct" study app.

Apply the design system above.

OVERLAY: rgba(0,0,0,0.60) backdrop-blur-8px covering full screen

MODAL CARD:
- 440px wide, centered on screen
- rounded-24, white bg, shadow-xl
- Scale-in animation on enter (spring easing)

TOP ACCENT BAR:
- 4px height full width at very top, indigo→violet→cyan gradient

CONTENT (padding 32px):
HEADER ROW (flex, gap 12px, align-start):
- 44px square rounded-14 box in indigo-100 bg: Brain icon 22px indigo-600
- Right of box:
  "Almost there!" 18px Inter 700
  "Tell us a bit about yourself — just once" 13px slate-400, mt-2

FORM (mt-24):
Full Name field:
- Label "YOUR NAME" 10px uppercase tracking-wider slate-400, mb-6
- Input: 44px, rounded-10, border, surface-2 bg, User icon leading left
- Placeholder "Your full name"
- Show an error variant: red-50 alert below "Please use your real name." in red-500 12px

Grade field (mt-16):
- Label "CLASS / GRADE"
- Select: 44px, rounded-10, surface-2 bg, BookOpen icon leading left
- Show "Select your class" placeholder + options Class 6–10

CTA BUTTON (mt-20, full-width, 44px, rounded-10):
- Indigo-to-violet gradient bg, white text
- Sparkles icon (16px) + "Start learning" text Inter 600 15px

DISABLED STATE (second artboard):
- Button opacity-50, cursor not-allowed (when fields empty)

LOADING STATE (third artboard):
- Button shows spinner (Loader2, animate-spin) + "Setting up…" text
```

---

## Prompt 12 — MOBILE APP HEADER

**Maps to:** Inline in `App.tsx`

```
Design a mobile top header bar for "CogniStruct" study app.

Apply the design system above.

SPECS:
- Fixed top, full width, height 56px
- Background: white 90% opacity + backdrop-blur-12
- Border-bottom: 1px #E4EAF6
- Padding: 0 16px

CONTENT (flex row, space-between, align-center):
LEFT:
- Hamburger menu button: 40×40, rounded-10, surface-2 bg on press
- Icon: Menu (3 lines) 22px slate-600

CENTER:
- Title text: current chapter name or "CogniStruct" — Inter 700 16px, truncate, max-width 160px
- Use Instrument Serif for chapter title

RIGHT (show 2 states):
State 1 — with points: amber-50 bg amber-100 border pill, Star icon 12px amber-500 + "1,240" bold 12px amber-700, 28px height, rounded-pill
State 2 — no points: invisible spacer 32px (maintain layout)

Show both states and dark mode variant.
```

---

## Notes for Stitch Export

After generating each component in Stitch:

1. Export as **React + Tailwind** (not CSS modules)
2. Keep all Tailwind class names — do not inline styles
3. Map the generated JSX structure to the existing component file
4. Replace **only** the JSX/className layer — keep all state, handlers, and logic untouched
5. Run `npm run build` to verify no TypeScript errors after each replacement

**Component file mapping:**
```
Prompt 1  → components/Auth.tsx
Prompt 2  → components/Sidebar.tsx
Prompt 3  → components/SubjectSelection.tsx (and chapter creation)
Prompt 4  → components/ChapterBreakdown.tsx
Prompt 5  → components/DoubtSolver.tsx
Prompt 6  → components/Flashcards.tsx
Prompt 7  → components/Quiz.tsx
Prompt 8  → components/Leaderboard.tsx
Prompt 9  → components/Community.tsx
Prompt 10 → components/Profile.tsx
Prompt 11 → components/ProfilePopup.tsx
Prompt 12 → App.tsx (MobileHeader inline component)
```
