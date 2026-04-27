# CogniStruct — Complete Redesign Pipeline

---

## PHASE 1 — FULL SYSTEM ANALYSIS

---

### 1. Pages & Routes

CogniStruct is a React SPA — routing is `AppMode` enum-based, not URL-based. All views are rendered inside a fixed shell with a persistent sidebar.

| AppMode / View | Route Equivalent | Description |
|---|---|---|
| `Auth` | `/` (unauthenticated) | Sign In / Sign Up / Verify Email screens |
| `ProfilePopup` | Modal overlay (first login) | One-time name + grade collection |
| `SUBJECT_SELECTION` | `/home` | Chapter library + chapter creator |
| `DASHBOARD` | `/chapter/:id` | Chapter breakdown — concepts list |
| `WHOLE_CHAPTER` | `/chapter/:id/explain` | AI chapter explanation |
| `MIND_MAP` | `/chapter/:id/mindmap` | Interactive SVG mind map |
| `ACTIVE_RECALL` | `/chapter/:id/recall` | Self-test question per concept |
| `FLASHCARDS` | `/chapter/:id/flashcards` | Spaced repetition card deck |
| `DOUBT_SOLVER` | `/chapter/:id/chat` | AI tutor chat |
| `REVISION` | `/chapter/:id/revision` | Revision prompts |
| `QUIZ` | `/chapter/:id/quiz` | MCQ / FIB / MATCH quiz |
| `LEADERBOARD` | `/leaderboard` | Top-50 points ranking |
| `COMMUNITY` | `/community` | Classmates browse + friend requests |
| `PROFILE` | `/profile` | User avatar, name, grade, hobbies |
| `ADMIN` | `/admin` | Teacher dashboard (is_admin only) |
| `ConfigError` | `/` (misconfigured) | Missing env-var error screen |
| `landing.html` | `/landing.html` | Public marketing landing page |
| `verify_template.html` | Email only | Supabase email verification template |

---

### 2. Components

#### Shell / Navigation
| Component | File | Description |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Fixed 256px left nav — logo, theme toggle, chapter tools, bottom nav (Leaderboard, Classmates, Profile, Sign Out), points badge |
| `MobileHeader` | `App.tsx` (inline) | Fixed top bar on `<md` — hamburger, chapter title, points badge |
| `SidebarOverlay` | `App.tsx` (inline) | Backdrop blur overlay when mobile sidebar open |
| `ContentSkeleton` | `App.tsx` (inline) | Loading skeleton for lazy-loaded views |

#### Auth Layer
| Component | File | Description |
|---|---|---|
| `Auth` | `components/Auth.tsx` | Two-stage form: login / signup + GSAP flip animation. Google OAuth button. Email verification "sent" stage. |
| `ProfilePopup` | `components/ProfilePopup.tsx` | Fixed overlay modal — full name + grade dropdown, profanity-filtered |
| `ConfigError` | `App.tsx` (inline) | Static error card if Supabase env missing |

#### Feature Views
| Component | File | Description |
|---|---|---|
| `SubjectSelection` | `components/SubjectSelection.tsx` | Chapter grid + create-new chapter button/form |
| `ChapterBreakdown` | `components/ChapterBreakdown.tsx` | Concept list with LOCKED/NOT_STARTED/IN_PROGRESS/MASTERED status badges, "Start Learning" CTA |
| `WholeChapter` | `components/WholeChapter.tsx` | Length/Depth toggle segmented controls, AI explanation rendered via `MarkdownRenderer` |
| `MindMap` | `components/MindMap.tsx` | SVG canvas with pan/zoom/drag, complexity & detail config, download PNG, history drawer |
| `ActiveRecall` | `components/ActiveRecall.tsx` | Single concept Q&A — show question, reveal answer, Pass/Fail |
| `Flashcards` | `components/Flashcards.tsx` | Card flip (3D CSS), Again/Hard/Good/Easy rating, AI-generate from cache, manual create form |
| `DoubtSolver` | `components/DoubtSolver.tsx` | Chat UI — message bubbles, typing indicator, clear chat, "cached" lightning badge |
| `RevisionMode` | `components/RevisionMode.tsx` | Revision prompts for IN_PROGRESS/MASTERED concepts |
| `Quiz` | `components/Quiz.tsx` | Type selector (MCQ/FIB/MATCH/MIXED), question count stepper, timer indicator, score screen with points earned, history drawer |
| `Leaderboard` | `components/Leaderboard.tsx` | Ranked list — medal icons (🥇🥈🥉), current user highlighted, skeleton loading, empty state |
| `Community` | `components/Community.tsx` | Three tabs (Explore / Requests / Friends), search input, classmate cards, send/cancel request, decline with reason, toast notifications |
| `Profile` | `components/Profile.tsx` | Avatar drag-and-drop upload, name / grade / hobbies form, inline validation, auto-save indicator, points badge |
| `AdminDashboard` | `components/AdminDashboard.tsx` | Admin-only teacher view |

#### Shared / Utility
| Component | File |
|---|---|
| `MarkdownRenderer` | `components/MarkdownRenderer.tsx` |
| Auth context | `contexts/AuthContext.tsx` |
| Supabase client | `lib/supabase.ts` |
| DB service | `services/db.ts` |
| Gemini service | `services/geminiService.ts` |
| Notifications | `services/notifications.ts` |
| Profanity utils | `utils/profanity.ts` |

---

### 3. Features & Functionality

#### Authentication
- Email/password sign-in + sign-up
- Google OAuth (via Supabase)
- Email verification flow (custom HTML template)
- Generic error messages (no user enumeration)
- JWT session via Supabase; attached to all AI API calls
- Rate limiting: 20 req/min per user on serverless endpoint

#### Chapter Management
- Create chapter by typing any topic (AI generates 5–8 concepts)
- Pre-filled default chapters (constants.ts)
- Concept statuses: LOCKED → NOT_STARTED → IN_PROGRESS → MASTERED
- Mastery level 0–100 per concept
- All chapters persisted to Supabase `user_data` table (JSON blob)
- Auto-save with 1-second debounce

#### AI Tools (all via `/api/gemini` serverless)
- **Chapter Explanation** — 3×3 config grid (Short/Standard/Long × Basic/Intermediate/Advanced), result cached in `chapter_explanation_cache`
- **Mind Map** — Complexity (Basic/Advanced) × Detail (Brief/Detailed), hierarchical SVG renderer, download PNG, history (last 5)
- **Active Recall** — Per-concept question generation, pass/fail → auto-creates flashcard on fail
- **Flashcards** — Spaced repetition (Again/Hard/Good/Easy), AI-generate from cache, manual create, per-chapter filter
- **Doubt Solver** — Conversational chat, 20-message history, subject-aware context, cached response detection
- **Quiz** — Types: MCQ/FIB/MATCH/MIXED, count selectable, points per correct answer, bonus points, Fisher-Yates shuffle, history (last 5), saves to `quiz_results`

#### Gamification
- Points earned per quiz answer (10 pts) + bonus (25 pts)
- `total_points` on profiles table, updated by DB trigger
- Leaderboard (top 50, descending by points)
- Points badge in sidebar + mobile header

#### Social / Community
- Browse classmates by grade
- Send friend requests (optional reason message)
- Accept / decline incoming requests (decline with reason)
- Friend list tab
- OneSignal push notifications on request received

#### Profile
- Avatar upload: click or drag-and-drop, 5MB limit, JPG/PNG/WebP/GIF
- Stored in Supabase `avatars` bucket, URL cache-busted on re-upload
- Editable: Full Name, Grade (Class 6–10), Hobbies
- Profanity filter on name + hobbies (English, Hindi, Gujarati)
- Auto-save with 1s debounce, visual "Saved ✓" flash

#### Theme System
- Light / Dark / Reading (sepia)
- Applied via `html` class (`dark`, `reading`)
- Persisted in user settings in Supabase

---

### 4. UI States

#### `Auth`
| State | Description |
|---|---|
| Default | Login form with email/password, Google button |
| Signup toggle | Flips card with GSAP 3D animation to signup form |
| Loading | Button spinner while submitting |
| Error | Inline error banner (generic message) |
| Verify-sent | Full card replacement — envelope icon, "check your email" instructions |

#### `ProfilePopup`
| State | Description |
|---|---|
| Default | Name input + grade select |
| Loading | Button spinner while saving |
| Error | Profanity error message below input |
| Disabled submit | Button disabled until both fields filled |

#### `SubjectSelection`
| State | Description |
|---|---|
| Default | Grid of chapter cards |
| Empty | No chapters — placeholder or pre-filled chapters shown |
| Creating | Chapter creation form open |
| Loading (create) | Spinner while AI generates chapter structure |

#### `ChapterBreakdown`
| State | Description |
|---|---|
| Default | Concept list with status badges |
| Concept LOCKED | Muted, non-interactive |
| Concept IN_PROGRESS | Highlighted ring |
| Concept MASTERED | Green checkmark badge |

#### `MindMap`
| State | Description |
|---|---|
| Config (initial) | Complexity + Detail selectors, Generate button |
| Loading | Spinner while fetching |
| Rendered | Pan/zoom/drag SVG canvas |
| History open | Side drawer listing past maps |
| Empty history | "No saved maps" message |
| Download | One-click PNG export |

#### `WholeChapter`
| State | Description |
|---|---|
| Default | Config controls, "Generate" button |
| Loading | Full-screen spinner |
| Rendered | Markdown content with headings, LaTeX, bullet points |
| Not available | "Explanation not available for this combination yet" message |

#### `DoubtSolver`
| State | Description |
|---|---|
| Loading history | Full-screen spinner |
| Default | Welcome message from AI |
| Typing (user) | Input active, send button enabled |
| Thinking | Three-dot typing indicator |
| Cached response | Lightning bolt badge under AI message |
| Error (silent) | Fail silently — user can retry |

#### `Flashcards`
| State | Description |
|---|---|
| Empty deck | "No cards for this chapter" + Generate AI / Create Manual buttons |
| Front face | Question/term displayed |
| Flipped | Answer revealed (3D flip animation) |
| Rating | Again/Hard/Good/Easy buttons visible after flip |
| Completed | All cards rated — completion screen |
| Create form | Manual card creation form |
| Generating AI | Spinner while fetching from cache |

#### `Quiz`
| State | Description |
|---|---|
| Type selector | MCQ/FIB/MATCH/MIXED choice |
| Loading | Spinner while fetching questions |
| Question | Question displayed with options/input |
| Answered MCQ | Correct green / wrong red highlight |
| Answered FIB | Text input locked, correct/wrong indicator |
| Answered MATCH | All pairs evaluated |
| Complete | Score screen, points earned |
| History | Drawer/tab with last 5 results |

#### `Leaderboard`
| State | Description |
|---|---|
| Loading | Skeleton rows |
| Populated | Ranked list, current user highlighted |
| Empty | No users with points yet |
| Error | Falls back silently (empty list) |

#### `Community`
| State | Description |
|---|---|
| Loading | Spinner |
| Explore tab (default) | Classmate grid with search |
| Requests tab | Pending incoming requests with accept/decline |
| Friends tab | Accepted connections |
| Decline input | Inline reason textarea expands |
| Request sent | Button changes to "Sent" / cancel |
| Toast | Success notification |

#### `Profile`
| State | Description |
|---|---|
| Default | Avatar + form fields |
| Drag over avatar | Upload zone highlighted |
| Uploading | Progress/spinner overlay on avatar |
| Saved | Green "Saved ✓" flash |
| Error | Inline upload or profanity error message |

---

### 5. User Flows

#### New User Sign-Up
1. Land on Auth screen (signup tab)
2. Enter email + password → submit
3. Email verification sent → "Check your email" screen
4. User clicks verify link in email
5. Redirected back to app → Auth session established
6. ProfilePopup shown (name + grade required)
7. Submit → profile saved → redirect to SubjectSelection

#### Returning User Sign-In
1. Auth screen (login tab, default)
2. Email + password → submit
3. → SubjectSelection if profile complete
4. → ProfilePopup if name/grade missing

#### Create + Study a Chapter
1. SubjectSelection → "New Chapter" button
2. Enter topic + select class → AI generates chapter (loading)
3. → ChapterBreakdown (concepts list)
4. Click concept → "Start Learning" → ActiveRecall
5. Answer shown → Pass → concept status → MASTERED
6. Fail → flashcard auto-created → redirect to Flashcards

#### Mind Map Flow
1. Sidebar → Mind Map
2. Select Complexity + Detail → Generate
3. SVG renders — pan, zoom, drag nodes
4. Download PNG or view history

#### Quiz + Points Flow
1. Sidebar → Quiz
2. Select type → fetch questions from cache → quiz starts
3. Answer each question (MCQ click / FIB type / MATCH select)
4. Score shown → points written to Supabase
5. Sidebar points badge updates

#### Friend Request Flow
1. Community → Explore tab
2. Find classmate → Send Request
3. Classmate receives push notification (OneSignal)
4. Classmate: Community → Requests tab → Accept/Decline
5. If accepted → both appear in each other's Friends tab

#### Error Paths
- Supabase env missing → `ConfigError` screen
- AI API call fails → silent fail in DoubtSolver, "not available" in WholeChapter
- Avatar upload fails → inline error message, upload reverts
- Profanity in name/hobbies → blocked with error
- Rate limit (429) → handled server-side

---

### 6. Responsiveness

#### Desktop (`md+`, ≥768px)
- Sidebar fixed, 256px wide, always visible
- Main content: `ml-64`, full remaining width
- Max content width varies per view
- DoubtSolver + MindMap: full-height, overflow-hidden

#### Mobile (`<md`, <768px)
- Sidebar hidden by default, slides in from left as overlay
- `MobileHeader` fixed top bar (56px)
- Content area has 56px top spacer

#### Tablet (`sm–md`, 640–768px)
- Same as mobile behavior (sidebar drawer)
- Some grid layouts shift from 3-col to 2-col

---

### 7. Design Problems

#### Critical UX Issues
1. **No URL routing** — back button broken, sharing chapter URL impossible
2. **Sidebar too wide at 256px** — no collapsed/icon-only mode
3. **No breadcrumb** in content area header — users lose chapter context
4. **Active Recall no concept picker** — must go back to Dashboard to switch concepts
5. **Flashcard deck shows ALL cards** without grouping by review date
6. **Quiz type selector is minimal** — no preview of question types

#### Visual/UI Issues
7. **Sidebar bottom section is cluttered** — points badge + 4 items + sign-out compete
8. **Theme toggle is tiny** — hard to target on mobile
9. **No empty state illustrations** — text-only placeholders
10. **WholeChapter shows no history** — re-generates each time despite DB storing last 5
11. **DoubtSolver clear-chat is desktop-only** — no mobile equivalent
12. **Concept status badges inconsistent** across views
13. **Points badge appears only when > 0** — jarring sudden appearance
14. **Community has no grade indicator** on classmate cards beyond data
15. **Profile auto-save is too subtle** — users unsure if changes persisted
16. **No keyboard shortcuts** on Mind Map

---

## PHASE 2 — ULTRA-DETAILED CLAUDE DESIGN PROMPT

---

```
You are a world-class product designer. Design the complete UI for CogniStruct —
an AI-powered study platform for Indian school students (Class 6–10).
The app is a React SPA with a persistent sidebar + main content area.

═══════════════════════════════════════════════════════════════
DESIGN TOKENS
═══════════════════════════════════════════════════════════════

COLORS — Light Mode
  Background:      #F8FAFF  (page bg — cool near-white)
  Surface:         #FFFFFF  (cards, sidebar)
  Surface-2:       #F1F5FE  (input backgrounds, secondary surfaces)
  Border:          #E4EAF6  (subtle borders)
  Text-primary:    #0F172A  (headings)
  Text-secondary:  #475569  (body, labels)
  Text-muted:      #94A3B8  (placeholders, captions)
  Primary-50:      #EEF2FF
  Primary-100:     #E0E7FF
  Primary-500:     #6366F1
  Primary-600:     #4F46E5
  Primary-700:     #4338CA
  Success:         #10B981
  Warning:         #F59E0B
  Danger:          #EF4444

COLORS — Dark Mode
  Background:      #060C17
  Surface:         #0F1829
  Surface-2:       #162035
  Border:          rgba(148,163,184,0.10)
  Text-primary:    #F1F5F9
  Text-secondary:  #94A3B8
  Text-muted:      #475569
  Primary-500:     #818CF8
  Primary glow:    rgba(99,102,241,0.15)

COLORS — Reading Mode (Sepia)
  Background:      #FBF6EE
  Surface:         #F5EDD8
  Surface-2:       #EDE0C4
  Border:          #D4C4A0
  Text-primary:    #3D2B1F
  Text-secondary:  #7A5C40
  Accent:          #C2782A

TYPOGRAPHY
  Display:   "Instrument Serif" — hero headings, chapter titles (italic optional)
  UI:        "Inter" — all interface text
  Mono:      "JetBrains Mono" — code blocks in MarkdownRenderer

  Scale:
    xs:   11px / 1.5 / 500
    sm:   13px / 1.6 / 400
    base: 15px / 1.65 / 400
    md:   17px / 1.6  / 600
    lg:   20px / 1.4  / 700
    xl:   24px / 1.3  / 700
    2xl:  32px / 1.2  / 800 (letter-spacing: -0.5px)
    3xl:  40px / 1.1  / 800 (letter-spacing: -1px)

SPACING (8px base grid)
  4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

BORDER RADIUS
  Buttons:  10px
  Inputs:   10px
  Cards:    16px
  Large:    20px
  XL:       24px
  Pill:     9999px

SHADOWS
  sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
  md:   0 4px 16px rgba(0,0,0,0.08)
  lg:   0 8px 32px rgba(0,0,0,0.12)
  glow: 0 4px 24px rgba(99,102,241,0.30)

ANIMATION TIMING
  Fast:    150ms ease-out   (hover states)
  Normal:  250ms ease-out   (transitions, slides)
  Slow:    400ms ease-out   (page transitions, modals)
  Spring:  cubic-bezier(0.34, 1.56, 0.64, 1)

═══════════════════════════════════════════════════════════════
LAYOUT SHELL
═══════════════════════════════════════════════════════════════

SIDEBAR (Desktop: always visible, 240px wide, fixed left)
  Background: Surface
  Border-right: 1px solid Border
  Display: flex column, height: 100vh

  [Section 1 — Logo area, 72px tall]
    Padding: 0 16px
    Logo: 32×32 rounded-12 gradient icon (indigo→violet) +
          "CogniStruct" in Inter 600 18px text-primary
    On click: go to SubjectSelection

  [Section 2 — Chapter context badge, conditional]
    Only visible when a chapter is active
    Chip: rounded-pill, bg primary-50 dark:primary-900/30,
          chapter title (truncated 1 line) + subject label
    "← Subjects" text button below chip

  [Section 3 — Chapter tools, scroll if overflow]
    Visible only when chapter is active
    Section label: "TOOLS" — 10px uppercase tracking-widest text-muted, padding 12px 16px 4px
    Nav items (8 items):
      - Breakdown (LayoutDashboard)
      - Understand Chapter (BookOpenText)
      - Mind Map (Network)
      - Active Recall (BrainCircuit)
      - Flashcards (Library)
      - Doubt Solver (MessageCircleQuestion)
      - Revision Mode (RotateCcw)
      - Quiz (Trophy)

    Nav item anatomy:
      Height: 40px, padding: 0 12px, border-radius: 10px
      Icon: 18×18, color: text-muted (default) / primary-500 (active)
      Label: 14px Inter 500
      Active state: bg primary-50 (light) / primary-900/30 (dark),
                    text primary-700 (light) / primary-300 (dark),
                    left border 2px primary-500
      Hover: bg surface-2, transition 150ms

    ADMIN item (conditional, is_admin only):
      Separator line above
      Item: BarChart3 icon + "Teacher View" label
      Distinct style: slate tones (not primary accent)

  [Section 4 — Bottom nav, mt-auto, border-top]
    Padding: 16px 8px

    Points widget (visible always, shows 0 if none):
      Rounded-12 card, bg amber-50 dark:amber-900/10, border amber-100
      Row: Star icon (filled amber-400) + "{n} pts" bold + "View ranking →" text-xs right
      Click → Leaderboard mode

    4 nav items below (same anatomy as chapter tools, full-width):
      - Select Subject (BookOpenText)
      - Leaderboard (Trophy)
      - Classmates (Users)
      - Profile (User)

    Sign Out (at very bottom):
      Hover: bg red-50 dark:red-900/10, text-red-600

  [Theme Switcher — above bottom nav items]
    Segmented control: 3 buttons in pill container
    Container: bg surface-2, border, p-1, rounded-10
    Buttons: Sun (Light) | Moon (Dark) | Book (Reading)
    Active: bg white/slate-700/amber-100 + shadow-sm

MOBILE HEADER (hidden on md+)
  Fixed top, full width, height: 56px
  Background: Surface/90% + backdrop-blur-12
  Border-bottom: Border
  Content: [Hamburger 40×40] [Chapter Title 16px serif bold] [Points pill OR spacer]
  Points pill: amber-50 bg, star icon + pts count, click → Leaderboard

MAIN CONTENT AREA
  Desktop: ml-240, flex-1
  Mobile: full width + 56px top padding
  DoubtSolver / MindMap: overflow-hidden, no padding (full-bleed)
  All others: padding 32px (desktop) / 16px (mobile), overflow-y-auto
  Max-width containers per view:
    SubjectSelection: max-w-5xl
    ChapterBreakdown: max-w-3xl
    WholeChapter: max-w-4xl
    Leaderboard: max-w-2xl
    Profile, Community: max-w-3xl
    Quiz, Flashcards, ActiveRecall: max-w-2xl

═══════════════════════════════════════════════════════════════
SCREEN DESIGNS
═══════════════════════════════════════════════════════════════

──────────────────────────────────────────
AUTH SCREEN
──────────────────────────────────────────
Full-screen split layout (desktop: 60/40, mobile: full-width card centered)

LEFT PANEL (60%, desktop only):
  Background: deep indigo gradient bg (#060C17 → #0F1829)
  Centered content vertically:
    Logo icon 48px + "CogniStruct" 32px font-serif
    Tagline: "Your AI study companion" — 20px text-muted italic
    Feature list (6 items, stagger animation in):
      Each: icon (16px, primary-400) + text (15px text-secondary)
      Items: AI Mind Maps, Doubt Solver, Smart Quizzes, Flashcards, Leaderboard, Community
    Bottom: "For Class 6–10 students" badge (pill, primary-900/50 bg)
  Floating orbs: 2 blurred gradient circles (primary + violet), animate float

RIGHT PANEL (40%, or full-width on mobile):
  Background: Surface
  Card: max-w-400, centered, padding 40px, rounded-24, shadow-lg

  SIGN IN STATE:
    Heading: "Welcome back" — 28px font-serif bold
    Subtext: "Don't have an account? Sign up" (link)
    Form:
      Email input: full-width, leading mail icon, label "Email"
      Password input: full-width, leading lock icon, trailing eye-toggle
      "Forgot password?" text-link right-aligned below password
      Primary CTA: "Sign In" — full-width, height 44px, gradient bg
      Divider: "— or —" with lines
      Google button: white bg, Google SVG icon + "Continue with Google"
    Error state:
      Alert card above form: red-50 bg, red-border, exclamation icon + message
      Input border turns red-400

  SIGN UP STATE (flip animation):
    Heading: "Create your account" — 28px
    Subtext: "Already have one? Sign in" (link)
    Same form as Sign In (email + password only)
    CTA: "Create Account"
    Google button same

  EMAIL SENT STATE:
    Envelope icon: 64px centered, indigo gradient bg circle
    Heading: "Check your email"
    Body: "We've sent a verification link to {email}. Click the link to activate your account."
    "Wrong email?" back link

──────────────────────────────────────────
PROFILE POPUP (First-login modal)
──────────────────────────────────────────
  Overlay: bg-black/60 backdrop-blur-sm
  Modal card: max-w-420, centered, padding 32px, rounded-24, shadow-xl, animate scale-in
  Top accent bar: 4px gradient (indigo→violet→cyan)

  Header: Brain icon (48px) in primary-100 rounded-16 + "Almost there!" bold + subtitle

  Name field:
    Label: "Your name" uppercase 11px tracking-wide text-muted
    Input: User icon leading, placeholder "Your full name", rounded-10
    Profanity error: red-50 alert below

  Grade field:
    Label: "Class / Grade"
    Select: BookOpen icon leading, "Select your class", options 6–10

  CTA: "Start learning →" — gradient, Sparkles icon, full-width, height 44px
  Disabled: opacity-50 while name/grade empty

──────────────────────────────────────────
SUBJECT SELECTION (Home)
──────────────────────────────────────────
  Header section (padding-top 48px):
    Greeting: "Good morning, {firstName} 👋" — 28px serif bold
    Subtitle: "Which chapter are you studying today?" — 16px text-muted

  "New Chapter" button:
    Primary gradient, Plus icon + "Start new chapter"
    Position: top-right on desktop, full-width below greeting on mobile

  Chapter grid:
    Grid: 3 columns desktop / 2 tablet / 1 mobile, gap 16px

    Chapter card anatomy:
      Background: Surface, Border: Border (default)
      Border-radius: 16px, Padding: 20px, Shadow: sm
      Hover: shadow-md, translateY(-2px), border primary-300, transition 200ms

      Top row: Subject badge (pill, color by subject) + timestamp text-xs text-muted
      Chapter title: 16px Inter 700, 2-line clamp
      Progress bar: 4px bar, % MASTERED, primary-500 fill, surface-2 track
      Progress text: "{n}/{total} mastered" — 12px text-muted
      Bottom row: Last accessed (relative, e.g. "2 days ago")

    Subject color mapping:
      Mathematics: amber / Physics: blue / Chemistry: violet / Biology: green
      History: orange / Geography: teal / Civics: indigo / Others: slate

    "New Chapter" create card:
      Dashed border, centered Plus icon + "Add new chapter" text
      Hover: bg primary-50, border primary-300

  Create Chapter modal/drawer:
    Slides up from bottom (mobile) / right panel (desktop)
    Fields: Topic name + Grade select
    CTA: "Generate Chapter" with Sparkles icon
    Loading: Skeleton shimmer + "AI is structuring your chapter..." message

──────────────────────────────────────────
CHAPTER BREAKDOWN (Dashboard)
──────────────────────────────────────────
  Page header (sticky):
    Subject badge (colored pill) + Chapter title (28px serif bold)
    Progress ring showing mastery %
    Action row: 6 tool shortcut icon-pill buttons with tooltips

  Concepts section:
    Label: "CONCEPTS" — uppercase 11px tracking-widest text-muted

    Concept card anatomy:
      Padding: 16px 20px, Border-radius: 14px, Border: 1px Border, bg Surface

      Left: status indicator dot (6px) + number badge
      Center: Title (16px 600) + Description (13px text-secondary, 2-line clamp)
      Right: status badge + estimated minutes + "Start Learning" (hover reveal)

      Status styles:
        LOCKED: opacity-50, lock icon, bg surface-2, no interaction
        NOT_STARTED: default styling, gray badge
        IN_PROGRESS: left border 2px primary-500, primary-50 bg tint, blue badge
        MASTERED: green left border, green-50 bg tint, green checkmark badge

      "Start Learning" CTA:
        Hidden by default, slides in from right on row hover
        Primary bg, white text, 13px, rounded-8

──────────────────────────────────────────
WHOLE CHAPTER (AI Explanation)
──────────────────────────────────────────
  Header:
    Breadcrumb: Subject > Chapter > "Understand Chapter"
    Title: chapter.title — 36px serif bold

  Config row:
    Card 1 — Length: 3-segment toggle: SHORT | STANDARD | LONG
    Card 2 — Depth: 3-segment toggle: BASIC | INTERMEDIATE | ADVANCED

    Segment toggle:
      Container: rounded-10 bg surface-2 p-1
      Button: flex-1 py-2 text-13px font-500
      Active: bg white (light) / bg slate-700 (dark), shadow-sm, primary text

    Generate button: primary gradient, Sparkles icon, full-width

  Loading state:
    Centered pulsing brain icon + "Generating explanation..." text
    Skeleton lines below

  Content state:
    Prose container: max-w-4xl, line-height 1.75
    h2/h3: left border 2px primary-400
    Code blocks: JetBrains Mono, surface-2 bg
    Bullet lists: square bullets in primary-400

  Previous explanations (collapsible):
    "Previous Explanations (3)" header
    List: date + config chips + "View" button

──────────────────────────────────────────
MIND MAP
──────────────────────────────────────────
  Full-bleed layout (flex-1 height, no padding)

  Toolbar (floating, top of canvas):
    Left: Complexity pills (BASIC | ADVANCED) + Detail pills (BRIEF | DETAILED)
    Center: "Generate" / "Re-generate" button (primary, Sparkles)
    Right: ZoomIn | ZoomOut | Fit | Download PNG | History
    All in rounded-16 card, bg Surface/90% backdrop-blur, shadow-md

  Canvas:
    Background: subtle dot-grid SVG pattern
    SVG tree renders centered

    Nodes:
      Root: 220×80, gradient bg (primary gradient), white text, rounded-16, shadow-glow
      Branch: 180×64, bg surface, border, text-primary, rounded-12, shadow-sm
      CONCEPT type: primary-100 tint
      EXAMPLE type: amber-50 tint
      FACT type: green-50 tint
    Edges: curved SVG bezier paths, stroke border-color, stroke-width 2
    Node hover: shadow-lg, scale 1.02, tooltip with description

  History drawer (slides in from right, 280px):
    Header: "Saved Maps" + X close
    List: date + config badges + "Load" button

  Loading: centered spinner + "Building your mind map..."

──────────────────────────────────────────
ACTIVE RECALL
──────────────────────────────────────────
  Centered card layout (max-w-xl, py-64)

  Progress: "Concept 3 of 8" — slim progress bar top

  Card: Border-radius 20px, shadow-lg, padding 40px, bg Surface
    Top: Concept name badge (primary-50 pill)
    Question: "What can you tell me about {concept.title}?" — 22px serif
    Textarea: Full-width, min-height 120px, rounded-12
    "Show Answer" button: secondary style, full-width

    Answer reveal (slides down):
      "Correct Answer:" label — 11px uppercase text-muted
      Answer text: 16px line-height 1.7

      Two CTA buttons:
        "I got it! ✓" — green bg (marks MASTERED)
        "I need more practice" — slate outline (creates flashcard)

──────────────────────────────────────────
FLASHCARDS
──────────────────────────────────────────
  Centered layout, max-w-md

  Header: "{n} cards" + "Add Card" (secondary) + "AI Generate" (primary) buttons
  Progress: "Card 4 of 12" + dot indicators

  Card (3D flip):
    Size: full-width, height 240px, Border-radius 20px
    Front: primary gradient bg, white text, centered question
      "FRONT" label 11px uppercase top-left
    Back: surface bg, border, answer centered, MarkdownRenderer
      "BACK" label 11px uppercase top-left
    Flip: CSS 3D rotateY 180deg, transition 400ms

  Rating buttons (slide up after flip):
    4 pill buttons row:
    Again: red-50 bg, red-600 text / Hard: amber-50 / Good: green-50 / Easy: primary-50

  Empty state:
    Brain icon 64px + "No flashcards yet" + "Generate with AI" + "Create manually" buttons

  Create form: Front textarea + Back textarea + Save/Cancel

──────────────────────────────────────────
DOUBT SOLVER (AI Tutor Chat)
──────────────────────────────────────────
  Full-height layout (no outer scroll)

  Header (sticky):
    "AI Tutor" title + "{subject} · {chapter}" subtitle + "Clear chat" (ghost, Trash2)
    Mobile: title in MobileHeader

  Messages area (flex-1, overflow-y-auto):
    Padding: 16px (mobile) / 24px (desktop)
    Max message width: 85%

    AI message:
      Left-aligned, Avatar: 32px circle, primary gradient, Bot icon
      Bubble: bg surface-2, border, rounded-16 rounded-tl-4, padding 12px 16px
      MarkdownRenderer, "Instant ⚡" badge if cached=true

    User message:
      Right-aligned, Avatar: slate-200 bg, User icon
      Bubble: bg slate-100 dark:bg-slate-800, rounded-16 rounded-tr-4

    Typing indicator: 3 bouncing dots in AI bubble, stagger-animate

  Input bar (sticky bottom, 72px):
    Container: border-top, bg Surface
    Inner: rounded-12 bg surface-2, border, focus-ring-primary
    Input: flex-1, bg transparent, 15px
    Send button: 36px circle, primary gradient

──────────────────────────────────────────
QUIZ
──────────────────────────────────────────
  Centered, max-w-2xl

  TYPE SELECTOR:
    Title: "Choose Quiz Type" — 24px serif
    4 type cards in 2×2 grid:
      Each: rounded-16, border, padding 20px, hover border-primary-300
      Icon: 32px colored
      MCQ: ListChecks / FIB: Pen / MATCH: Shuffle / MIXED: AlignLeft

    Question count stepper: Minus | count | Plus (5–20 range)
    "Start Quiz" CTA: primary full-width, height 48px
    History section: collapsible "Recent Scores"

  QUESTION SCREEN:
    Progress: "Q3 of 10" + progress bar + timer
    Question card: rounded-20, border, padding 28px, shadow-md
      Question: 20px Inter 600, MarkdownRenderer (KaTeX)

      MCQ options: 4 buttons, full-width, rounded-12, text-left
        Default: surface bg / Selected: primary-50 + primary border
        Correct reveal: green-50 + green border + checkmark right
        Wrong reveal: red-50 + red border + X right

      FIB input: large 18px text input + "Check Answer" primary button
        Correct: green border / Wrong: red border + correct answer shown

      MATCH pairs: Left column (fixed) + Right column (selectable)
        Correct match: green / Wrong: red

      "Next Question →" button

  SCORE SCREEN:
    Trophy icon 64px, confetti burst animation
    Score: "{X} / {Y}" — 48px serif bold
    Percentage: color coded (green >70%, amber 40-70%, red <40%)
    Points earned: "+{n} points" badge, amber bg, star icon, Spring animation
    "Play Again" (outline) + "Back to Chapter" (primary)

──────────────────────────────────────────
LEADERBOARD
──────────────────────────────────────────
  Centered, max-w-2xl, py-48

  Header:
    Trophy icon 56px glow box
    "Leaderboard" — 32px serif bold
    Current user: "You're #{n}" pill (primary gradient text, star icon)

  Top 3 podium row:
    3 cards side by side: #2 (medium height) #1 (tallest) #3 (medium)
    Each: gradient bg (gold/silver/bronze), avatar 52px, name, points, medal emoji

  Rest of list (4–50):
    Rows: rounded-14, 64px tall, border, bg Surface
    Columns: Rank # | Avatar 40px | Name + Grade | Points badge
    Current user row: primary-50 bg, primary border, "You" label

  Loading: 7 skeleton rows
  Empty: "Be the first to earn points! Take a quiz."

──────────────────────────────────────────
COMMUNITY
──────────────────────────────────────────
  Max-w-3xl

  Header:
    "Classmates" — 28px serif
    "Class {grade}" context badge
    Notification bell: red dot if pending requests

  Tab bar: "Explore" | "Requests {n}" | "Friends {n}"
    Underline style, primary-500 active indicator

  Search bar (Explore): Search icon leading, rounded-12

  EXPLORE — Classmate grid (2 cols desktop, 1 mobile):
    Student card: rounded-16, border, padding 16px
      Avatar 48px (initials fallback) + Name 16px bold + Grade badge
      Hobbies: 13px text-muted italic, 2-line clamp
      Action button:
        "Send Request" — outline primary, UserPlus icon
        "Request Sent" — ghost/disabled, Check icon
        "Friends ✓" — green, UserCheck icon
        "Incoming ↓" — amber

  REQUESTS — Incoming list:
    Request card: Avatar + Name + "wants to connect" text
    Optional reason: italic quote block
    Action row: "Accept" (green, Check) + "Decline" (ghost, X)
    Decline expanded: textarea + "Send decline" button

  FRIENDS — Accepted connections:
    Same card, "Friends since {date}" instead of action

  Toast (top-right, auto-dismiss 3s):
    Rounded-12, bg slate-900, white text, border primary-500/30
    Icon + message + auto progress bar

──────────────────────────────────────────
PROFILE
──────────────────────────────────────────
  Max-w-2xl, py-48

  Header section (centered):
    Avatar: 96px circle, shadow-lg
    Upload overlay on hover: camera icon, "Change photo", dark overlay
    Drag-over: primary dashed border ring + "Drop to upload"
    Uploading: circular progress spinner overlay
    Error: red banner below

    Name: 24px serif bold
    Email: 14px text-muted, lock icon prefix (not editable)
    Points badge: amber pill, star icon
    "View ranking" link

  Form card: rounded-20, border, padding 28px 32px
    Full Name: User icon + text input
    Grade: BookOpen icon + select (Class 6–10)
    Hobbies & Interests: Smile icon + textarea (3 rows)

    Each field label: uppercase 11px text-muted
    Input height: 44px, rounded-10, focus ring primary

    Profanity errors: inline red alert below field

    "Saved ✓" indicator:
      Check icon + "Changes saved" text, fades in then auto-hides 2s
      Position: top-right of card, floating

──────────────────────────────────────────
CONFIG ERROR SCREEN
──────────────────────────────────────────
  Full-screen centered card, max-w-md
  Warning triangle icon 64px, amber bg circle
  Title: "Configuration Required" — 24px serif
  Body: explains missing env vars
  Status checklist: colored dots + labels
  Footer: "After adding the keys, redeploy or refresh"

═══════════════════════════════════════════════════════════════
COMPONENT LIBRARY (Shared)
═══════════════════════════════════════════════════════════════

BUTTONS
  Primary: gradient(indigo→violet) bg, white text, shadow-glow on hover
  Secondary: surface bg, primary border, primary text
  Ghost: transparent, text-secondary, hover bg-surface-2
  Danger: red-50 bg, red-600 text, border red-200; hover red-100 bg
  Icon-only: 36px or 40px square, rounded-10, surface-2 bg
  All: height 40px (default) / 44px (form CTAs) / 36px (compact)
       font: Inter 600 14px, transition 150ms

INPUTS
  Height: 44px (text) / auto (textarea)
  Border: 1px Border (default) / primary-300 (focus) / red-300 (error)
  Focus: ring-2 primary-500/20
  Background: Surface-2
  Leading icon: text-muted, 18px, absolute left-12
  Error message: 12px red-500, mt-4

BADGES / CHIPS
  Status: LOCKED (slate) / NOT_STARTED (slate) / IN_PROGRESS (blue) / MASTERED (green)
  Subject: color-mapped pill
  Points: amber
  All: 11px uppercase tracking-wide, 4px 10px padding, rounded-pill

CARDS
  Base: rounded-16, border 1px Border, bg Surface, padding 20px
  Interactive: hover shadow-md, hover translateY(-2px), hover border-primary-200

SKELETON / LOADING
  Shimmer: bg-gradient-to-r from-surface-2 via-border to-surface-2, background-size 200%, animate
  Shape: rounded to match element it replaces

TOAST
  Position: fixed top-right, z-50
  Animation: slide-in-from-right 250ms, auto-dismiss 3s
  Progress bar: width 100%→0% over 3s, primary color

SEGMENTED CONTROL
  Container: rounded-10 bg Surface-2, p-1
  Button: flex-1, rounded-8, py-2, text-13px font-500
  Active: bg white (light) / surface (dark), shadow-sm
  Transition: 150ms

═══════════════════════════════════════════════════════════════
INTERACTION SPECS
═══════════════════════════════════════════════════════════════

PAGE TRANSITIONS
  New view: opacity 0→1, translateY 16px→0, 300ms ease-out

SIDEBAR MOBILE
  Open: translateX(-100%)→0, 300ms ease-out, overlay fades in
  Close: reverse

FLASHCARD FLIP
  perspective 1000px on container
  rotateY: 0→180deg, 400ms ease-in-out
  backface-visibility hidden on both faces

QUIZ ANSWER REVEAL
  Correct: border green, bg flash green-50, scale 1.02 spring
  Wrong: border red, shake animation (translateX ±4px, 400ms)

RATING BUTTONS (Flashcards)
  Slide up: translateY 20px→0, opacity 0→1, stagger 50ms each

CONCEPT STATUS CHANGE
  MASTERED: checkmark springs in (scale 0→1, Spring easing)
  Progress bar: width transitions smoothly

TOAST
  Enter: translateX(120%)→0, 250ms spring
  Exit: opacity 1→0, 200ms
  Progress bar: linear shrink over 3s

═══════════════════════════════════════════════════════════════
RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════════════════════════
  sm:  640px
  md:  768px  ← sidebar becomes persistent above this
  lg:  1024px
  xl:  1280px

MOBILE SPECIFIC
  All tap targets: min 44×44px
  Chat input: stays above keyboard (position fixed + env(keyboard-inset-height))
  Mind Map toolbar: wraps to 2 rows on small screens
  Quiz option buttons: full-width always on mobile
```

---

## PHASE 3 — DESIGN HANDOFF FORMAT

### Design Tokens (`tokens.ts`)

```typescript
export const tokens = {
  color: {
    primary: {
      50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE',
      300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1',
      600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81'
    },
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
    bg:       { light: '#F8FAFF',  dark: '#060C17'  },
    surface:  { light: '#FFFFFF',  dark: '#0F1829'  },
    surface2: { light: '#F1F5FE',  dark: '#162035'  },
    border:   { light: '#E4EAF6',  dark: 'rgba(148,163,184,0.10)' },
    text: {
      primary:   { light: '#0F172A', dark: '#F1F5F9' },
      secondary: { light: '#475569', dark: '#94A3B8' },
      muted:     { light: '#94A3B8', dark: '#475569' },
    },
  },
  font: {
    display: '"Instrument Serif", Georgia, serif',
    ui:      '"Inter", system-ui, sans-serif',
    mono:    '"JetBrains Mono", monospace',
  },
  radius: { btn: 10, input: 10, card: 16, lg: 20, xl: 24, pill: 9999 },
  shadow: {
    sm:   '0 1px 3px rgba(0,0,0,0.06)',
    md:   '0 4px 16px rgba(0,0,0,0.08)',
    lg:   '0 8px 32px rgba(0,0,0,0.12)',
    glow: '0 4px 24px rgba(99,102,241,0.30)',
  },
  transition: {
    fast:   '150ms ease-out',
    normal: '250ms ease-out',
    slow:   '400ms ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};
```

### Component Mapping Table

| Design Component | Current File | Target Location |
|---|---|---|
| Sidebar | `Sidebar.tsx` | `<aside>` + nav items |
| Nav item active state | `Sidebar.tsx:110` | `.bg-primary-50` block |
| Auth card | `Auth.tsx` | card root div |
| Chapter card | `SubjectSelection.tsx` | chapter grid item |
| Concept row | `ChapterBreakdown.tsx` | concept list item |
| Message bubble | `DoubtSolver.tsx:190` | `.rounded-2xl` divs |
| Flashcard 3D | `Flashcards.tsx` | card + 3D wrapper |
| Quiz option | `Quiz.tsx` | MCQ button |
| Leaderboard row | `Leaderboard.tsx:57` | `rowBg` function |
| Profile avatar zone | `Profile.tsx` | avatar + dropzone |

---

## PHASE 4 — IMPLEMENTATION INSTRUCTIONS FOR CLAUDE CODE

### Overview

The UI layer is entirely Tailwind CSS. **Zero logic changes needed.** Only className strings change. All TypeScript, state, API calls, and hooks stay untouched.

### Step 1 — Update Tailwind Config

```typescript
// tailwind.config.ts — extend, do NOT replace
theme: {
  extend: {
    colors: {
      primary: {
        50:'#EEF2FF', 100:'#E0E7FF', 200:'#C7D2FE',
        300:'#A5B4FC', 400:'#818CF8', 500:'#6366F1',
        600:'#4F46E5', 700:'#4338CA', 800:'#3730A3', 900:'#312E81'
      },
      surface:   'var(--color-surface)',
      'surface-2': 'var(--color-surface-2)',
    },
    fontFamily: {
      serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      sans:  ['"Inter"', 'system-ui', 'sans-serif'],
      mono:  ['"JetBrains Mono"', 'monospace'],
    },
    borderRadius: { '10':'10px', '14':'14px', '20':'20px', '24':'24px' },
    boxShadow: { glow: '0 4px 24px rgba(99,102,241,0.30)' },
    animation: {
      'shake': 'shake 0.4s ease-in-out',
      'float': 'float 6s ease-in-out infinite',
    },
    keyframes: {
      shake: {
        '0%,100%':{ transform:'translateX(0)' },
        '20%,60%':{ transform:'translateX(-4px)' },
        '40%,80%':{ transform:'translateX(4px)' },
      },
      float: {
        '0%,100%':{ transform:'translateY(0)' },
        '50%':    { transform:'translateY(-12px)' },
      },
    },
  }
}
```

### Step 2 — CSS Variables

```css
/* index.css */
:root {
  --color-surface: #ffffff;
  --color-surface-2: #F1F5FE;
}
.dark {
  --color-surface: #0F1829;
  --color-surface-2: #162035;
}
.reading {
  --color-surface: #F5EDD8;
  --color-surface-2: #EDE0C4;
}
```

### Step 3 — Refactoring Rules

**RULE 1: Change class strings, never logic.**
```tsx
// BEFORE
<div className="bg-white dark:bg-slate-900 rounded-2xl">
// AFTER
<div className="bg-surface rounded-20 shadow-sm border border-slate-200/60 dark:border-white/[0.08]">
```

**RULE 2: Keep all event handlers, state, refs as-is.**

**RULE 3: Replace inline style colors with Tailwind where possible.**
```tsx
// BEFORE
style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
// AFTER
className="bg-gradient-to-br from-primary-500 to-violet-500"
```

**RULE 4: Do not restructure JSX trees.** Only add/remove/change className and style props.

**RULE 5: Sidebar active state** — change active nav item classes:
```tsx
// BEFORE
'bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-100'
// AFTER
'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-l-2 border-primary-500'
```

### Step 4 — File Priority Order

Execute in this order (each file is independent):

1. `index.css` — CSS variables, font imports, skeleton shimmer, typing dot animation
2. `tailwind.config.ts` — extend tokens
3. `components/Auth.tsx` — split layout, left feature panel
4. `components/ProfilePopup.tsx` — top accent bar, polish
5. `components/Sidebar.tsx` — layout sections, points widget, bottom nav
6. `App.tsx` — MobileHeader redesign, ContentSkeleton shimmer
7. `components/SubjectSelection.tsx` — chapter card, create card dashed
8. `components/ChapterBreakdown.tsx` — concept row, tool shortcuts row
9. `components/DoubtSolver.tsx` — message bubbles, input bar
10. `components/MindMap.tsx` — toolbar, dot-grid canvas bg, node colors
11. `components/WholeChapter.tsx` — config cards, prose typography
12. `components/Flashcards.tsx` — 3D card faces, rating buttons slide-up
13. `components/Quiz.tsx` — type selector grid, question card, score screen
14. `components/Leaderboard.tsx` — podium top-3, row redesign
15. `components/Community.tsx` — tab bar, student cards, toast
16. `components/Profile.tsx` — avatar dropzone, form card, saved indicator

### Step 5 — Safe Replacement Guidelines

| Risk Level | Action | Guideline |
|---|---|---|
| Safe | className changes | Do freely |
| Safe | Adding wrapper divs for layout | OK — preserve event bubbling |
| Caution | Changing input `type` | Never |
| Caution | Reordering form fields | Never — breaks auto-save |
| NEVER | Changing state variable names | Breaks all references |
| NEVER | Removing conditional renders | Breaks feature gating |
| NEVER | Changing onClick handlers | Breaks navigation |
| NEVER | Touching `services/`, `contexts/`, `lib/` | Logic-only files |
| NEVER | Modifying TypeScript types in `types.ts` | Breaks compilation |

### Step 6 — Verification Checklist

After each component refactor:
- [ ] TypeScript compiles (`npm run build`)
- [ ] Auth flow: sign in + sign up + verify email
- [ ] Theme toggle switches light/dark/reading
- [ ] Mobile sidebar opens/closes via hamburger + overlay
- [ ] Chapter creation works (AI generates concepts)
- [ ] All 8 chapter tool nav items navigate correctly
- [ ] Doubt solver sends messages, typing indicator shows
- [ ] Flashcard 3D flip works, rating buttons appear
- [ ] Quiz completes, score screen shows points
- [ ] Leaderboard loads and highlights current user
- [ ] Profile avatar upload works (click + drag-drop)
- [ ] Community tabs all render with correct data
