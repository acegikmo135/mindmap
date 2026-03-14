# CogniStruct NCERT

A structured learning platform for NCERT students with AI-powered mind maps, active recall, and doubt solving.

## Local Development

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
4. **Run the development server**
   ```bash
   npm run dev
   ```
5. **Open the app**
   - Navigate to `http://localhost:3000`

## Deployment (Vercel)

This project is ready to be deployed on Vercel.

1. Push your code to a GitHub repository.
2. Connect your repository to Vercel.
3. Add the following environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Vercel will automatically detect the Vite project and deploy it.

## Features

- **Subject Selection**: Choose from prefilled NCERT subjects or create your own.
- **Chapter Breakdown**: Sequential learning path with mastery tracking.
- **AI Mind Maps**: Generate hierarchical mind maps for any chapter.
- **Active Recall**: Test your knowledge with AI-generated questions.
- **Flashcards**: Spaced repetition for better retention.
- **Doubt Solver**: Real-time AI tutor for clarifying concepts.
- **Community**: Connect with classmates in the same grade.
- **Profile**: Personalize your learning experience.
