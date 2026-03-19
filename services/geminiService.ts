import { GoogleGenAI, Type } from "@google/genai";
import { Message, Chapter } from '../types';

// Safely accessing the API key
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;

export const isGeminiConfigured = Boolean(API_KEY);

export const initGemini = () => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing.");
    return;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
};

const LATEX_INSTRUCTION = "ALWAYS use LaTeX format for ALL mathematical expressions, equations, and variables. Enclose them in single dollar signs (e.g., $x^2 + y^2 = z^2$). Use **bold** for key terms.";

export const explainChapter = async (chapter: Chapter, length: string = 'STANDARD', depth: string = 'INTERMEDIATE'): Promise<string> => {
    if (!ai) initGemini();
    if (!ai) return "AI Service Unavailable";

    try {
        const conceptList = chapter.concepts.map(c => c.title).join(", ");
        
        const lengthInstruction = {
            'SHORT': 'Keep the explanation very concise and brief.',
            'STANDARD': 'Provide a balanced explanation with moderate detail.',
            'LONG': 'Provide a very detailed and comprehensive explanation.'
        }[length] || 'Provide a balanced explanation.';

        const depthInstruction = {
            'BASIC': 'Use very simple language and focus only on core concepts.',
            'INTERMEDIATE': 'Use standard 8th-grade language with some technical terms explained.',
            'ADVANCED': 'Go deeper into the "why" and "how", including more advanced connections.'
        }[depth] || 'Use standard 8th-grade language.';

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Explain the chapter "${chapter.title}" for an 8th-grade student.
            
            Configuration:
            - Length: ${length} (${lengthInstruction})
            - Depth: ${depth} (${depthInstruction})
            
            Instructions:
            1. Use simple, easy-to-understand language.
            2. Cover these concepts: ${conceptList}.
            3. ${LATEX_INSTRUCTION}
            4. Use bullet points and headers to make it readable.
            5. Explain using real-world analogies.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text || "Could not generate explanation.";
    } catch (error) {
        console.error("Explain Chapter Error", error);
        return "An error occurred while explaining the chapter.";
    }
}

export const generateChapter = async (topic: string, level: string): Promise<Chapter | null> => {
  if (!ai) initGemini();
  if (!ai) {
    console.error("AI not initialized");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a structured learning path for the topic: "${topic}" at the level of "${level}".
      Structure this as a Chapter with sequential Concepts.
      
      Rules:
      1. Create 5-8 concepts.
      2. 'estimatedMinutes' should be 10-30 mins.
      3. Use simple, clear titles.
      
      Return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The main chapter title" },
            subject: { type: Type.STRING, description: "The broader subject (e.g. Physics, History)" },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  dependencyNote: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "description", "estimatedMinutes"]
              }
            }
          },
          required: ["title", "subject", "concepts"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Post-process to add IDs and ensure structure match
    const chapterId = `chap_${Date.now()}`;
    const concepts = (data.concepts || []).map((c: any, index: number) => ({
      ...c,
      id: `${chapterId}_c${index + 1}`,
      status: 'NOT_STARTED', // Default to unlocked for all
      masteryLevel: 0,
      prerequisites: index > 0 ? [`${chapterId}_c${index}`] : [],
      dependencyNote: c.dependencyNote || (index > 0 ? "Building on previous concept" : "Foundational")
    }));

    return {
      id: chapterId,
      title: data.title || topic,
      subject: data.subject || "General",
      concepts: concepts,
      createdAt: Date.now()
    };

  } catch (error) {
    console.error("Generate Chapter Error:", error);
    return null;
  }
};

export const generateMindMapData = async (chapterTitle: string, complexity: string, detail: string): Promise<{ rootTitle: string, nodes: any[] } | null> => {
  if (!ai) initGemini();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a hierarchical mind map structure for the chapter "${chapterTitle}".
      Configuration:
      - Complexity: ${complexity} (BASIC: core concepts only, ADVANCED: deep connections)
      - Detail Level: ${detail} (BRIEF: short labels, DETAILED: full descriptions)

      Output Rules:
      1. Return JSON.
      2. 'rootTitle': The central node name.
      3. 'nodes': Array of child nodes.
      4. Each node must have 'id' (string), 'title', 'description', and 'parentId' (referencing another node id or 'root').
      5. Ensure strictly connected tree structure (no orphans).
      6. Generate between 5 to 15 nodes depending on complexity.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootTitle: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  parentId: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["CONCEPT", "EXAMPLE", "FACT"], description: "Type of node" }
                },
                required: ["id", "title", "description", "parentId"]
              }
            }
          },
          required: ["rootTitle", "nodes"]
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Generate MindMap Error:", error);
    return null;
  }
};

export const generateRecallQuestion = async (conceptTitle: string, context: string): Promise<string> => {
  if (!ai) initGemini();
  if (!ai) return "Describe the main idea of this concept.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a single, conceptual active recall question for the concept "${conceptTitle}".
      Context: ${context}.
      
      Instructions:
      1. Simple language suitable for 8th grade.
      2. ${LATEX_INSTRUCTION}
      3. Short and direct (under 25 words).
      4. NOT multiple choice.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.trim() || "Explain this concept in your own words.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Explain the core principle of this concept.";
  }
};

export const evaluateAnswer = async (question: string, userAnswer: string, conceptTitle: string): Promise<{ isCorrect: boolean; feedback: string }> => {
  if (!ai) initGemini();
  if (!ai) return { isCorrect: true, feedback: "Simulation: Good job!" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly 8th-grade tutor.
      Concept: ${conceptTitle}
      Question: ${question}
      Student Answer: ${userAnswer}

      Instructions:
      1. Evaluate conceptual understanding.
      2. Return JSON.
      3. 'feedback' must be in simple words, encouraging.
      4. ${LATEX_INSTRUCTION} in the feedback if explaining math.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
          },
          required: ["isCorrect", "feedback"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);

  } catch (error) {
    console.error("Evaluation Error:", error);
    return { isCorrect: false, feedback: "Could not evaluate answer due to connection error. Please try again." };
  }
};

export const getDoubtResponse = async (history: Message[], currentContext: string): Promise<string> => {
  if (!ai) initGemini();
  if (!ai) return "I am ready to help, but the AI service is currently unavailable.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `You are an expert Tutor for 8th grade students.
        The student is studying: ${currentContext}.
        
        Instructions:
        1. Answer doubts with extreme clarity and simplicity.
        2. Use analogies suitable for a 13-14 year old.
        3. ${LATEX_INSTRUCTION}
        4. Be concise but complete.
        5. Use **bold** for important terms.`,
      },
    });

    const lastUserMessage = history[history.length - 1];

    const result = await chat.sendMessage({
      message: lastUserMessage.content
    });

    return result.text || "I'm not sure how to answer that right now.";

  } catch (error) {
    console.error("Doubt Solver Error:", error);
    return "I encountered an error trying to process your doubt.";
  }
};