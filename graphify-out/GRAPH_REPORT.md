# Graph Report - .  (2026-04-19)

## Corpus Check
- Corpus is ~45,672 words - fits in a single context window. You may not need a graph.

## Summary
- 244 nodes · 294 edges · 39 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.79)
- Token cost: 12,000 input · 4,500 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core App State Handlers|Core App State Handlers]]
- [[_COMMUNITY_Product Spec & Security Policies|Product Spec & Security Policies]]
- [[_COMMUNITY_Learning Infrastructure & Setup|Learning Infrastructure & Setup]]
- [[_COMMUNITY_Active Recall & Flashcards UI|Active Recall & Flashcards UI]]
- [[_COMMUNITY_Auth & Profile Management|Auth & Profile Management]]
- [[_COMMUNITY_Product Vision & UX|Product Vision & UX]]
- [[_COMMUNITY_Mind Map Feature|Mind Map Feature]]
- [[_COMMUNITY_Quiz Engine|Quiz Engine]]
- [[_COMMUNITY_Gemini API Gateway|Gemini API Gateway]]
- [[_COMMUNITY_Doubt Solver Chat|Doubt Solver Chat]]
- [[_COMMUNITY_Chapter Explanation|Chapter Explanation]]
- [[_COMMUNITY_Dev Proxy Plugin|Dev Proxy Plugin]]
- [[_COMMUNITY_Profile & Avatar Upload|Profile & Avatar Upload]]
- [[_COMMUNITY_Rate Limiting Tests|Rate Limiting Tests]]
- [[_COMMUNITY_Flashcard Generation Tests|Flashcard Generation Tests]]
- [[_COMMUNITY_Profile Popup|Profile Popup]]
- [[_COMMUNITY_Revision Mode|Revision Mode]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Subject Selection|Subject Selection]]
- [[_COMMUNITY_JWT Auth Tests|JWT Auth Tests]]
- [[_COMMUNITY_CORS Tests|CORS Tests]]
- [[_COMMUNITY_Chapter Explanation Tests|Chapter Explanation Tests]]
- [[_COMMUNITY_Chapter Generation Tests|Chapter Generation Tests]]
- [[_COMMUNITY_MindMap Generation Tests|MindMap Generation Tests]]
- [[_COMMUNITY_Active Recall Tests|Active Recall Tests]]
- [[_COMMUNITY_Quiz Generation Tests|Quiz Generation Tests]]
- [[_COMMUNITY_Doubt Solver Tests|Doubt Solver Tests]]
- [[_COMMUNITY_Active Recall Concept|Active Recall Concept]]
- [[_COMMUNITY_App Constants|App Constants]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Type Definitions|Type Definitions]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_Chapter Breakdown|Chapter Breakdown]]
- [[_COMMUNITY_Leaderboard|Leaderboard]]
- [[_COMMUNITY_Markdown Renderer|Markdown Renderer]]
- [[_COMMUNITY_Supabase Client|Supabase Client]]
- [[_COMMUNITY_Push Notifications|Push Notifications]]
- [[_COMMUNITY_Google OAuth|Google OAuth]]
- [[_COMMUNITY_Tailwind CSS|Tailwind CSS]]

## God Nodes (most connected - your core abstractions)
1. `Security Audit Report` - 18 edges
2. `Supabase (PostgreSQL + Auth)` - 12 edges
3. `Vercel Serverless Function /api/gemini` - 11 edges
4. `CogniStruct Product` - 10 edges
5. `callAPI()` - 9 edges
6. `handler()` - 7 edges
7. `public.profiles DB Table` - 6 edges
8. `Quiz Feature (MCQ/FIB/MATCH/MIXED)` - 5 edges
9. `loadData()` - 4 edges
10. `handleSubmit()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Row Level Security (RLS)` --semantically_similar_to--> `Avatar Storage RLS Policies`  [INFERRED] [semantically similar]
  product-spec.md → storage_setup.md
- `Vite Dev Plugin Missing CORS Headers (Real Bug)` --semantically_similar_to--> `OPEN-02: Missing Security Headers on SPA Routes`  [INFERRED] [semantically similar]
  testsprite_tests/testsprite-mcp-test-report.md → report.md
- `profiles Table v1 (no email/hobbies/is_admin)` --semantically_similar_to--> `Supabase Authentication & DB Setup Guide`  [INFERRED] [semantically similar]
  old_script.txt → instructions.md
- `Cognitive Science Pillars (Active Recall, Spaced Repetition, Chunking)` --semantically_similar_to--> `NCERT Curriculum Scope`  [INFERRED] [semantically similar]
  ABOUT.md → docs.md
- `loadData()` --calls--> `getUserProfile()`  [INFERRED]
  App.tsx → services\db.ts

## Hyperedges (group relationships)
- **AI Feature Generation Pipeline** — productspec_vercelServerless, productspec_geminiAI, productspec_jwtAuth, productspec_rateLimiting [EXTRACTED 0.95]
- **Security Audit Bug Coverage** — report_securityAudit, report_bug004PromptInjection, report_bug005UnauthAPI, report_bug006RateLimitBypass [EXTRACTED 0.95]
- **Core Learning Features Sharing user_data Table** — productspec_chapterManagement, productspec_mindMap, productspec_flashcards, productspec_userDataTable [EXTRACTED 0.90]

## Communities

### Community 0 - "Core App State Handlers"
Cohesion: 0.08
Nodes (17): handleSaveProfilePopup(), loadData(), handleAcceptRequest(), handleDeclineRequest(), handleSendRequest(), triggerToast(), deleteFriendRequest(), getMindMaps() (+9 more)

### Community 1 - "Product Spec & Security Policies"
Cohesion: 0.08
Nodes (35): friend_requests Table, Community Feature, CORS Allowlist Policy, Friend Requests System, Google Gemini 2.5 Flash Lite, JWT Authentication, Leaderboard Feature, OneSignal Push Notifications (+27 more)

### Community 2 - "Learning Infrastructure & Setup"
Cohesion: 0.08
Nodes (30): Custom MarkdownRenderer (react-markdown + remark-math + rehype-katex), Spaced Repetition Principle, KaTeX CSS (cdn.jsdelivr.net), Supabase Authentication & DB Setup Guide, Initial DB Schema (old_script.txt), profiles Table v1 (no email/hobbies/is_admin), Supabase Realtime Publication, Admin/Teacher Dashboard (+22 more)

### Community 3 - "Active Recall & Flashcards UI"
Cohesion: 0.2
Nodes (12): handleSubmit(), loadQuestion(), handleGenerateAI(), callAPI(), evaluateAnswer(), explainChapter(), generateChapter(), generateFlashcards() (+4 more)

### Community 4 - "Auth & Profile Management"
Cohesion: 0.18
Nodes (10): handleGoogleSignIn(), handleSubmit(), handleAuthChange(), refreshProfile(), signIn(), signInWithGoogle(), signUp(), getUserProfile() (+2 more)

### Community 5 - "Product Vision & UX"
Cohesion: 0.15
Nodes (14): Cognitive Science Pillars (Active Recall, Spaced Repetition, Chunking), Future Roadmap (Quests, PDF Upload, Voice), NCERT Curriculum Scope, User Journey Flow, Dark Mode CSS, Fixed Viewport Layout (overflow hidden), ESM Import Map (esm.sh CDN), Reading Mode (Sepia Theme CSS) (+6 more)

### Community 6 - "Mind Map Feature"
Cohesion: 0.18
Nodes (3): buildTree(), place(), subtreeW()

### Community 7 - "Quiz Engine"
Cohesion: 0.24
Nodes (7): checkFIB(), checkMatchPair(), feedbackMessage(), findCorrectIdx(), handleGenerate(), norm(), resetAnswers()

### Community 8 - "Gemini API Gateway"
Cohesion: 0.46
Nodes (7): getAI(), getServerSupabase(), handler(), isRateLimited(), isValidUUID(), sanitize(), sanitizeArray()

### Community 9 - "Doubt Solver Chat"
Cohesion: 0.33
Nodes (5): getChatHistory(), saveChatHistory(), buildContext(), handleSend(), loadHistory()

### Community 10 - "Chapter Explanation"
Cohesion: 0.33
Nodes (4): getExplanations(), saveExplanation(), fetchExplanation(), load()

### Community 11 - "Dev Proxy Plugin"
Cohesion: 0.5
Nodes (0): 

### Community 12 - "Profile & Avatar Upload"
Cohesion: 0.83
Nodes (3): handleFile(), onDrop(), onFileInput()

### Community 13 - "Rate Limiting Tests"
Cohesion: 0.5
Nodes (3): Test that the in-memory rate limiter allows up to 20 POST /api/gemini requests p, # TODO: Replace this with a valid Supabase JWT token for testing, test_rate_limiting_enforcement_per_user()

### Community 14 - "Flashcard Generation Tests"
Cohesion: 0.67
Nodes (2): Confirm that POST /api/gemini with action 'generate-flashcards' and at least one, test_flashcard_generation_with_concepts()

### Community 15 - "Profile Popup"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Revision Mode"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Sidebar Navigation"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Subject Selection"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "JWT Auth Tests"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "CORS Tests"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Chapter Explanation Tests"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Chapter Generation Tests"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "MindMap Generation Tests"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Active Recall Tests"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Quiz Generation Tests"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Doubt Solver Tests"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Active Recall Concept"
Cohesion: 1.0
Nodes (2): Active Recall Principle, Active Recall Feature

### Community 28 - "App Constants"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "App Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Type Definitions"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Admin Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Chapter Breakdown"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Leaderboard"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Markdown Renderer"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Supabase Client"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Push Notifications"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Google OAuth"
Cohesion: 1.0
Nodes (1): Google OAuth Sign-In

### Community 38 - "Tailwind CSS"
Cohesion: 1.0
Nodes (1): Tailwind CSS via CDN

## Knowledge Gaps
- **28 isolated node(s):** `Test that the in-memory rate limiter allows up to 20 POST /api/gemini requests p`, `# TODO: Replace this with a valid Supabase JWT token for testing`, `Confirm that POST /api/gemini with action 'generate-flashcards' and at least one`, `Google OAuth Sign-In`, `Chapter Management Feature` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Profile Popup`** (2 nodes): `ProfilePopup.tsx`, `ProfilePopup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Revision Mode`** (2 nodes): `RevisionMode.tsx`, `toggleCheck()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Navigation`** (2 nodes): `Sidebar.tsx`, `totalPoints()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Subject Selection`** (2 nodes): `SubjectSelection.tsx`, `SubjectSelection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JWT Auth Tests`** (2 nodes): `test_jwt_authentication_middleware_verification()`, `TC001_jwt_authentication_middleware_verification.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CORS Tests`** (2 nodes): `test_cors_enforcement_for_allowed_origins()`, `TC003_cors_enforcement_for_allowed_origins.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chapter Explanation Tests`** (2 nodes): `test_chapter_explanation_generation()`, `TC004_chapter_explanation_generation.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chapter Generation Tests`** (2 nodes): `test_chapter_generation_with_topic_and_level()`, `TC005_chapter_generation_with_topic_and_level.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MindMap Generation Tests`** (2 nodes): `test_generate_mindmap_complexity_and_detail()`, `TC006_mind_map_generation_with_complexity_and_detail.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Active Recall Tests`** (2 nodes): `test_active_recall_question_generation()`, `TC007_active_recall_question_generation.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Quiz Generation Tests`** (2 nodes): `test_quiz_generation_with_valid_count_and_type()`, `TC009_quiz_generation_with_valid_count_and_type.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Doubt Solver Tests`** (2 nodes): `test_doubt_solver_chat_functionality()`, `TC010_doubt_solver_chat_functionality.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Active Recall Concept`** (2 nodes): `Active Recall Principle`, `Active Recall Feature`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Constants`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Point`** (1 nodes): `index.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Definitions`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Dashboard`** (1 nodes): `AdminDashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chapter Breakdown`** (1 nodes): `ChapterBreakdown.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Leaderboard`** (1 nodes): `Leaderboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Markdown Renderer`** (1 nodes): `MarkdownRenderer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Client`** (1 nodes): `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Push Notifications`** (1 nodes): `OneSignalSDKWorker.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Google OAuth`** (1 nodes): `Google OAuth Sign-In`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind CSS`** (1 nodes): `Tailwind CSS via CDN`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleGenerate()` connect `Core App State Handlers` to `Active Recall & Flashcards UI`, `Mind Map Feature`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Supabase (PostgreSQL + Auth)` connect `Learning Infrastructure & Setup` to `Product Spec & Security Policies`, `Product Vision & UX`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `Test that the in-memory rate limiter allows up to 20 POST /api/gemini requests p`, `# TODO: Replace this with a valid Supabase JWT token for testing`, `Confirm that POST /api/gemini with action 'generate-flashcards' and at least one` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App State Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Product Spec & Security Policies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Learning Infrastructure & Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._