import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface RepoNode {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

export interface ArchitectureAnalysis {
  projectIdea: string;
  summary: string;
  onboardingPath: {
    step: string;
    file: string;
    reason: string;
  }[];
  components: {
    name: string;
    description: string;
    layer: "Frontend" | "Backend" | "Database" | "External" | "Infrastructure" | "Core Logic";
    dependencies: string[];
    responsibilities: string[];
    recentActivity?: string;
    relevantFiles: string[];
    modificationGuide: string;
    blastRadius: string[]; // Components affected if this one changes
  }[];
  dataFlow: {
    from: string;
    to: string;
    description: string;
  }[];
  bottlenecks: string[];
  contributionHistory: string;
  contributionGaps: {
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    suggestedSteps: string[];
  }[];
}

export async function analyzeArchitecture(tree: RepoNode[], recentCommits?: any[]): Promise<ArchitectureAnalysis> {
  const fileList = tree.map(n => n.path).join("\n");
  const commitContext = recentCommits ? JSON.stringify(recentCommits.slice(0, 15)) : "No recent commit data available.";
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a world-class software architect and technical lead. Your goal is to onboard two types of developers:
    1. NEW CONTRIBUTORS: Help them find purposeful "gaps" to start their open-source journey.
    2. EXPERIENCED DEVELOPERS: Help them find exactly which files to touch and how to modify them for specific features.

    TASK:
    - Group files into logical SECTIONS (Components).
    - Assign each section to a LAYER (Frontend, Backend, Database, External, Infrastructure, Core Logic).
    - For each section, identify the 3-5 most RELEVANT FILES from the tree.
    - For each section, provide a MODIFICATION GUIDE: "To change X in this section, you should look at file Y and follow pattern Z."
    - Identify ACTIONABLE GAPS with step-by-step implementation plans.
    - Map DATA FLOW between components clearly.
    - Create a GUIDED ONBOARDING PATH: A sequence of 3-5 files a new contributor should read first (README, entry points, etc.) and WHY.
    - For each component, identify its BLAST RADIUS: Which other components are most likely to break if this component's logic changes?

    File Tree:
    ${fileList}

    Recent Commits:
    ${commitContext}
    `,
    config: {
      systemInstruction: "You are a technical lead. Be specific, technical, and actionable. Map components to actual file paths from the tree.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectIdea: { type: Type.STRING },
          summary: { type: Type.STRING },
          onboardingPath: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                file: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["step", "file", "reason"]
            }
          },
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                layer: { type: Type.STRING, enum: ["Frontend", "Backend", "Database", "External", "Infrastructure", "Core Logic"] },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                recentActivity: { type: Type.STRING },
                relevantFiles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actual file paths from the tree belonging to this section." },
                modificationGuide: { type: Type.STRING, description: "Technical guide on how to extend or fix this specific section." },
                blastRadius: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Names of other components affected by changes here." }
              },
              required: ["name", "description", "layer", "dependencies", "responsibilities", "relevantFiles", "modificationGuide", "blastRadius"]
            }
          },
          dataFlow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["from", "to", "description"]
            }
          },
          bottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
          contributionHistory: { type: Type.STRING },
          contributionGaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                suggestedSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "difficulty", "suggestedSteps"]
            }
          }
        },
        required: ["projectIdea", "summary", "onboardingPath", "components", "dataFlow", "bottlenecks", "contributionHistory", "contributionGaps"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze architecture");
  }
}

export async function askCodebase(query: string, analysis: ArchitectureAnalysis): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI assistant helping a developer understand a codebase. 
    Use the following architectural analysis as context to answer the user's question.
    
    Context:
    ${JSON.stringify(analysis)}
    
    Question: ${query}
    `,
  });

  return response.text || "I'm sorry, I couldn't find an answer to that.";
}

export async function explainFile(filePath: string, content: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain the logic and purpose of the following file in plain English. 
    Focus on what it does, why it exists, and any complex logic it contains.
    
    File Path: ${filePath}
    Content:
    ${content}
    `,
  });

  return response.text || "No explanation available.";
}
