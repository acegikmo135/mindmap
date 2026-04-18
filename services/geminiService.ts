/**
 * geminiService.ts
 *
 * All Gemini API calls are proxied through the /api/gemini serverless function.
 * The Gemini API key lives ONLY in Vercel environment variables (server-side).
 * It is never bundled into the browser.
 */
import { Message, Chapter, QuizQuestion, QuizType } from '../types';
import { supabase } from '../lib/supabase';

// Always true from the frontend's perspective — the server holds the key.
export const isGeminiConfigured = true;

// ── Internal helper ────────────────────────────────────────────────────────────
async function callAPI(action: string, params: Record<string, unknown>): Promise<string | null> {
  // Attach the Supabase session JWT so the serverless function can verify the caller.
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30-second hard timeout

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, ...params }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error(`[geminiService] ${action} failed:`, err.error);
      return null;
    }

    const data = await res.json();
    return data.text ?? null;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error(`[geminiService] ${action} timed out after 30s`);
    } else {
      console.error(`[geminiService] ${action} network error:`, err?.message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const explainChapter = async (
  chapter: Chapter,
  length = 'STANDARD',
  depth = 'INTERMEDIATE'
): Promise<string> => {
  const conceptList = chapter.concepts.map((c) => c.title).join(', ');
  const text = await callAPI('explain', {
    chapterTitle: chapter.title,
    concepts: conceptList,
    length,
    depth,
  });
  return text ?? 'An error occurred while explaining the chapter.';
};

export const generateChapter = async (topic: string, level: string): Promise<Chapter | null> => {
  const text = await callAPI('generate-chapter', { topic, level });
  if (!text) return null;

  try {
    const data = JSON.parse(text);
    const chapterId = `chap_${Date.now()}`;
    const concepts = (data.concepts || []).map((c: any, index: number) => ({
      ...c,
      id: `${chapterId}_c${index + 1}`,
      status: 'NOT_STARTED',
      masteryLevel: 0,
      prerequisites: index > 0 ? [`${chapterId}_c${index}`] : [],
      dependencyNote: c.dependencyNote || (index > 0 ? 'Building on previous concept' : 'Foundational'),
    }));
    return {
      id: chapterId,
      title: data.title || topic,
      subject: data.subject || 'General',
      concepts,
      createdAt: Date.now(),
    };
  } catch {
    console.error('[geminiService] Failed to parse chapter JSON');
    return null;
  }
};

export const generateMindMapData = async (
  chapterTitle: string,
  complexity: string,
  detail: string
): Promise<{ rootTitle: string; nodes: any[] } | null> => {
  const text = await callAPI('generate-mindmap', { chapterTitle, complexity, detail });
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.error('[geminiService] Failed to parse mind map JSON');
    return null;
  }
};

export const generateRecallQuestion = async (
  conceptTitle: string,
  context: string
): Promise<string> => {
  const text = await callAPI('generate-question', { conceptTitle, context });
  return text ?? 'Explain this concept in your own words.';
};

export const generateFlashcards = async (
  chapterTitle: string,
  concepts: string[]
): Promise<{ front: string; back: string }[]> => {
  const text = await callAPI('generate-flashcards', { chapterTitle, concepts });
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    console.error('[geminiService] Failed to parse flashcards JSON');
    return [];
  }
};

export const evaluateAnswer = async (
  question: string,
  userAnswer: string,
  conceptTitle: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
  const text = await callAPI('evaluate', { question, userAnswer, conceptTitle });
  if (!text) return { isCorrect: false, feedback: 'Could not evaluate. Please try again.' };
  try {
    return JSON.parse(text);
  } catch {
    return { isCorrect: false, feedback: 'Could not evaluate. Please try again.' };
  }
};

export const generateQuiz = async (
  chapterTitle: string,
  concepts: string[],
  quizType: QuizType,
  count = 5
): Promise<QuizQuestion[] | null> => {
  const text = await callAPI('generate-quiz', { chapterTitle, concepts, quizType, count });
  if (!text) return null;
  try {
    const qs = JSON.parse(text) as QuizQuestion[];
    return qs;
  } catch {
    console.error('[geminiService] Failed to parse quiz JSON');
    return null;
  }
};

export const getDoubtResponse = async (
  history: Message[],
  currentContext: string
): Promise<string> => {
  const text = await callAPI('doubt', {
    history: history.map((m) => ({ role: m.role, content: m.content })),
    context: currentContext,
  });
  return text ?? "I encountered an error. Please try again.";
};
