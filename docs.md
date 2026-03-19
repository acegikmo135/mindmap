# CogniStruct NCERT - Documentation

## Purpose
CogniStruct NCERT is an advanced AI-powered educational platform designed specifically for students following the NCERT curriculum. The primary goal is to transform passive reading into active learning through cognitive science principles like active recall, spaced repetition, and visual mapping.

## Core Philosophy
Most students read textbooks linearly, which leads to poor retention. CogniStruct breaks down complex chapters into structured nodes, visualizes them as mind maps, and forces the brain to retrieve information through active testing, ensuring long-term mastery of the subject matter.

---

## Key Features

### 1. Adaptive Subject & Chapter Selection
Students can select their subjects and specific chapters from the NCERT curriculum. The app comes pre-filled with core science and social science chapters but allows for dynamic expansion.

### 2. AI-Powered Chapter Breakdown
Instead of a wall of text, chapters are broken down into:
- **Core Concepts:** Bite-sized learning modules.
- **Key Definitions:** Essential terminology.
- **Summary Points:** Quick review bullets.

### 3. Interactive Mind Maps
Visual learners can explore chapters through dynamic, interactive mind maps. These maps show the hierarchical relationship between concepts, helping students build a mental framework of the topic.

### 4. Active Recall Engine
The heart of the platform. Instead of just reading, students are prompted to explain concepts in their own words. The AI (Gemini) evaluates their responses, provides feedback, and identifies gaps in their understanding.

### 5. Smart Flashcards
Automatically generated flashcards based on chapter content. These use spaced repetition principles to help students memorize facts, formulas, and definitions efficiently.

### 6. AI Doubt Solver
A dedicated chat interface where students can ask specific questions about any topic. The AI acts as a 24/7 personal tutor, providing context-aware explanations based on the NCERT syllabus.

### 7. Revision Mode
A specialized mode that aggregates all learned concepts and focuses on areas where the student struggled previously, optimizing the study session for maximum impact.

### 8. Community & Collaboration
- **Profiles:** Personalized student profiles tracking progress.
- **Friends System:** Connect with peers to see study progress.
- **Leaderboards:** Gamified learning to encourage consistency.

### 9. Admin Dashboard
A control center for managing curriculum content, monitoring user engagement, and updating the knowledge base.

---

## How It Works

### Technical Stack
- **Frontend:** React with TypeScript and Tailwind CSS.
- **Backend/Auth:** Supabase (PostgreSQL, Real-time, Auth).
- **AI Engine:** Google Gemini API for content breakdown, evaluation, and doubt solving.
- **Visualizations:** D3.js/SVG for mind mapping.
- **Notifications:** OneSignal for push alerts and study reminders.

### User Journey
1. **Authentication:** Users sign in via Email or Google.
2. **Onboarding:** Users set their grade and select a subject.
3. **Learning:**
   - Select a chapter.
   - View the mind map to understand the structure.
   - Read specific concepts.
4. **Testing:**
   - Use "Active Recall" to test understanding.
   - AI provides a score and corrective feedback.
5. **Retention:**
   - Practice flashcards daily.
   - Use the Doubt Solver for confusing topics.
6. **Progress:** Track mastery levels in the profile and compete with friends in the community tab.

---

## Configuration Requirements
To run the full suite of features, the following environment variables are required:
- `GEMINI_API_KEY`: For AI features.
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: For database and auth.
- `VITE_ONESIGNAL_APP_ID`: For push notifications.

---

## Future Roadmap
- **Gamified Quests:** Story-based learning paths.
- **PDF Upload:** Allow students to upload their own notes for AI breakdown.
- **Voice Interaction:** Talk to the Doubt Solver for a hands-free experience.
