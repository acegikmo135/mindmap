# About CogniStruct

**CogniStruct** is an advanced, AI-powered educational platform designed to transform passive reading into active learning. Specifically tailored for students (with a focus on NCERT and 8th-grade curriculum), it leverages cutting-edge cognitive science principles and generative AI to ensure deep understanding and long-term retention of academic content.

---

## 🚀 Core Philosophy: The Science of Learning

CogniStruct is built on three pillars of cognitive science:

1.  **Active Recall:** Instead of just re-reading, students are forced to retrieve information from their memory through AI-generated conceptual questions.
2.  **Spaced Repetition:** The platform identifies weak areas and schedules reviews (Flashcards) at optimal intervals to prevent the "forgetting curve."
3.  **Chunking & Scaffolding:** Complex chapters are broken down into digestible "Concepts," allowing students to build a solid foundation before moving to advanced topics.

---

## ✨ Key Features

### 1. AI-Powered Chapter Generation
Users can select from pre-filled NCERT chapters or generate a custom learning path for any topic. The AI (Gemini 3 Flash) automatically:
-   Segments the topic into logical concepts.
-   Estimates study time for each part.
-   Identifies prerequisites and dependencies.

### 2. Interactive Mind Maps
Visual learners can explore a hierarchical representation of the chapter.
-   **Dynamic Generation:** AI creates a structured map of facts, concepts, and examples.
-   **Visual Hierarchy:** Helps students understand the "big picture" and how different ideas connect.

### 3. Active Recall Module
For every concept, the AI generates a unique, conceptual question.
-   **Conceptual Testing:** Moves beyond simple "what is" questions to "how" and "why."
-   **AI Evaluation:** The student's answer is evaluated by a "Friendly AI Tutor" that provides encouraging feedback and clarifies misconceptions.

### 4. Spaced Repetition Flashcards
A built-in flashcard system that tracks mastery.
-   **Auto-Generation:** AI creates high-quality cards based on the chapter content.
-   **Mastery Tracking:** Cards are categorized (Again, Hard, Good, Easy) to optimize review schedules.

### 5. Real-time Doubt Solver (AI Tutor)
A sophisticated chatbot designed to act as a personal tutor.
-   **Context Awareness:** The AI knows exactly what chapter and concept the student is studying.
-   **LaTeX Support:** Renders complex mathematical formulas and scientific equations beautifully using KaTeX.
-   **Analogy-Based Teaching:** Explains difficult concepts using real-world analogies suitable for 13-14 year olds.

### 6. Multi-Mode Reading
-   **Whole Chapter:** Access the full content for traditional reading.
-   **Revision Mode:** AI-generated summaries and key points for quick last-minute reviews.

### 7. Community & Social Learning
-   **Profiles:** Personalized user profiles with grade and school tracking.
-   **Friend System:** Connect with classmates, send friend requests, and see who's online.
-   **Collaborative Spirit:** Encourages a community-driven approach to mastering subjects.

---

## 🛠️ Technical Stack

### Frontend
-   **React 19:** Utilizing the latest React features for a high-performance, modern UI.
-   **TypeScript:** Ensuring type safety and robust code across the entire application.
-   **Vite:** Lightning-fast build tool and development server.
-   **Tailwind CSS:** Utility-first styling for a clean, responsive, and highly customizable design.
-   **Lucide React:** A beautiful, consistent icon set.
-   **Framer Motion:** Smooth, physics-based animations for an "app-like" feel.

### Backend & Infrastructure
-   **Supabase:**
    -   **Authentication:** Secure Google and Email/Password login.
    -   **PostgreSQL Database:** Real-time data synchronization for user progress, chat history, and social features.
-   **OneSignal:** Integrated push notifications to remind students of their study goals and flashcard reviews.

### AI Engine
-   **Google Gemini 3 Flash:** The core intelligence of the platform.
    -   **Structured Outputs:** Using JSON schemas to generate consistent learning paths and mind maps.
    -   **Thinking Mode:** Optimized for low-latency, high-reasoning tutoring.
    -   **Multimodal Ready:** Capable of processing text and (in future) images/audio.

---

## 🎨 Special Implementation Details

### 📐 LaTeX & Markdown Rendering
CogniStruct uses a custom `MarkdownRenderer` that combines `react-markdown` with `remark-math` and `rehype-katex`. This allows the AI to output professional-grade scientific notation that is rendered perfectly in the browser.

### 🌓 Advanced Theming
The app supports three distinct visual modes:
-   **Light Mode:** Clean and professional.
-   **Dark Mode:** High contrast for night-time study.
-   **Reading Mode (Sepia):** A specialized mode designed to reduce eye strain during long reading sessions, inspired by e-readers.

### 📱 Mobile-First Architecture
The UI is meticulously crafted for mobile devices:
-   **Fixed Viewport:** Prevents annoying page-level scrolling, keeping the header and navigation always accessible.
-   **Custom Scroll Management:** The chat and content areas use isolated scrolling to ensure a smooth, native-app experience on touch devices.

---

## 📊 Data Model (Supabase)

-   **`profiles`:** Stores user identity, grade, school, and avatar.
-   **`user_data`:** A centralized store for chapters, flashcards, settings, and mind maps.
-   **`chat_history`:** Persists AI tutor conversations across sessions.
-   **`friend_requests`:** Manages the social graph and peer-to-peer connections.

---

**CogniStruct** isn't just a study tool; it's a digital brain assistant that helps students learn faster, remember longer, and master their curriculum with confidence.
