# About CogniStruct

**CogniStruct** is an advanced, AI-native educational platform meticulously designed to transform how students in **Classes 6–10** engage with their curriculum. By merging state-of-the-art Generative AI with established principles of cognitive science, CogniStruct moves beyond the limitations of passive learning, empowering students to achieve deep conceptual mastery and long-term retention.

---

## 🧠 The Science of Learning: Beyond Passive Reading

CogniStruct is built on a "Retain-Recall-Master" framework derived from cognitive psychology:

1.  **Fighting the Forgetting Curve:** Research by Hermann Ebbinghaus shows that we forget 70% of new information within 24 hours. CogniStruct’s **Spaced Repetition (SRS)** system strategically schedules reviews right as memory begins to fade, effectively flattening the forgetting curve.
2.  **The Testing Effect:** Studies show that the act of *retrieving* information (Active Recall) strengthens neural pathways more than simply re-reading. Our AI generates conceptual questions that force the brain to work, leading to 300% better retention.
3.  **Scaffolding & Cognitive Load:** By breaking complex NCERT chapters into "Concepts" and "Sub-concepts" (Chunking), we prevent cognitive overload, allowing students to build mental models step-by-step.
4.  **Dual Coding:** CogniStruct uses both verbal explanations and visual **Mind Maps** to encode information in two different ways, making it easier to retrieve later.

---

## ✨ Key Features & Implementation Details

### 🛠️ AI-Powered Learning Path Generation
CogniStruct doesn't just display text; it builds a curriculum.
-   **Structured Hierarchy:** Generates 5–8 distinct concepts per chapter with estimated study times and prerequisites.
-   **Dynamic Progress Tracking:** Concepts move through a lifecycle of `LOCKED` → `NOT_STARTED` → `IN_PROGRESS` → `MASTERED`.
-   **Adaptive Prerequisites:** Ensures students have a solid foundation before unlocking advanced sub-topics.

### 🗺️ Intelligent Mind Maps
Visualizing connections through a hierarchical graph interface.
-   **Algorithm-Driven Layout:** Uses a horizontal tree layout algorithm with custom horizontal and vertical spacing to ensure readability on all screens.
-   **Semantic Node Types:** Nodes are categorized as `CONCEPT` (core idea), `EXAMPLE` (practical application), or `FACT` (verified data point).
-   **Interactive Exploration:** Supports semantic zooming, node collapsing/expanding, and high-resolution PNG exports for offline study.

### 💬 Subject-Aware AI Tutor (Doubt Solver)
A 24/7 personal tutor that adapts its pedagogical style based on the subject:
-   **Mathematics:** Focuses on step-by-step derivation and logical flow.
-   **Sciences:** Employs real-world analogies (e.g., explaining photosynthesis through a "kitchen factory" analogy).
-   **Humanities:** Focuses on the "Who, What, When, and Why" to build historical and social context.
-   **LaTeX Rendering:** Beautifully renders complex equations (e.g., $E = mc^2$ or $\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$) using KaTeX.

### 🗂️ Spaced Repetition Flashcards
A digital version of the Leinter System, powered by AI.
-   **3D Interactive Interface:** High-performance 3D flip animations using CSS transforms for an "app-like" feel.
-   **Mastery Rating:** Students rate cards as `Again`, `Hard`, `Good`, or `Easy`.
-   **AI Auto-Generation:** Instantly creates 5-10 high-quality cards based on any chapter's core facts and definitions.

### 📖 Comprehensive Explanations & Quizzes
-   **Multi-Depth Explanations:** Toggle between `Basic`, `Intermediate`, and `Advanced` depth depending on your current level of understanding.
-   **Diversified Quiz Engine:** Generates MCQ (multiple choice), FIB (fill in the blanks), and MATCH (matching pairs) using an unbiased Fisher-Yates shuffle for options.

---

## 🛠️ Technical Architecture

### Frontend Excellence
-   **Framework:** React 19 (Strict Mode) with TypeScript for maximum type safety.
-   **Styling:** Tailwind CSS for utility-first design, ensuring a consistent mobile-first experience.
-   **State Management:** Context API for global state (Auth, Theme) and local state for feature-specific logic.
-   **Visuals:** Lucide React icons, Framer Motion for micro-interactions, and custom SVG rendering for Mind Maps.

### Robust Backend & Security
-   **Serverless API:** Vercel serverless functions handle all AI logic, keeping API keys securely on the server side.
-   **Database:** Supabase (PostgreSQL) with **Row Level Security (RLS)** ensuring every student's data is private and secure.
-   **Identity:** Google OAuth and Email/Password authentication via Supabase Auth.
-   **Real-time:** Supabase real-time subscriptions for instant community and leaderboard updates.

### Content Safety (The Guardrail System)
-   **Multi-Lingual Profanity Filter:** Detects and blocks inappropriate content in English, Hindi, and Gujarati.
-   **Identity Protection:** Peer-to-peer visibility is strictly limited to name, grade, and hobbies; emails and private data are never exposed.

---

## 🚀 The Student Journey

1.  **Discover:** Start by typing a topic or selecting a standard NCERT subject.
2.  **Explore:** Generate a Mind Map to see the "Big Picture" and how concepts interlink.
3.  **Learn:** Read deep explanations or use the AI Tutor to clarify specific doubts.
4.  **Practice:** Engage in Active Recall sessions and take AI-generated quizzes to earn points.
5.  **Retain:** Use Flashcards for a few minutes daily to lock knowledge into long-term memory.
6.  **Compete:** Track your progress on the global leaderboard and connect with motivated peers.

---

**CogniStruct** is more than a study app—it's a cognitive partner. Built by **Manthan**, it is dedicated to making the highest quality of personalized, scientifically-backed education available to every student, everywhere.
