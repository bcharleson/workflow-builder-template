import { NextResponse } from "next/server";

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutput?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
  isReasoning?: boolean;
};

export type ModelsResponse = {
  models: ModelInfo[];
  provider: string;
  cached: boolean;
  error?: string;
};

// In-memory cache with TTL
const modelCache = new Map<
  string,
  { models: ModelInfo[]; timestamp: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback static model lists
const FALLBACK_MODELS: Record<string, ModelInfo[]> = {
  openai: [
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "openai/gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      supportsTools: true,
    },
    {
      id: "openai/gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "openai/gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      supportsTools: true,
    },
    { id: "openai/o1", name: "o1", provider: "openai", isReasoning: true },
    {
      id: "openai/o1-mini",
      name: "o1 Mini",
      provider: "openai",
      isReasoning: true,
    },
    {
      id: "openai/o3-mini",
      name: "o3 Mini",
      provider: "openai",
      isReasoning: true,
    },
  ],
  anthropic: [
    {
      id: "anthropic/claude-opus-4.5",
      name: "Claude Opus 4.5",
      provider: "anthropic",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "anthropic/claude-sonnet-4.0",
      name: "Claude Sonnet 4.0",
      provider: "anthropic",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "anthropic/claude-3.7-sonnet",
      name: "Claude 3.7 Sonnet",
      provider: "anthropic",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "anthropic/claude-3.5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      supportsTools: true,
    },
  ],
  google: [
    {
      id: "google/gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "google",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "google/gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      supportsTools: true,
      supportsVision: true,
    },
    {
      id: "google/gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      provider: "google",
      supportsTools: true,
    },
  ],
  meta: [
    {
      id: "meta/llama-4-maverick",
      name: "Llama 4 Maverick",
      provider: "meta",
      supportsTools: true,
    },
    {
      id: "meta/llama-4-scout",
      name: "Llama 4 Scout",
      provider: "meta",
      supportsTools: true,
    },
    {
      id: "meta/llama-3.3-70b",
      name: "Llama 3.3 70B",
      provider: "meta",
      supportsTools: true,
    },
    { id: "meta/llama-3.1-8b", name: "Llama 3.1 8B", provider: "meta" },
  ],
  mistral: [
    {
      id: "mistral/mistral-large",
      name: "Mistral Large",
      provider: "mistral",
      supportsTools: true,
    },
    {
      id: "mistral/mistral-medium",
      name: "Mistral Medium",
      provider: "mistral",
      supportsTools: true,
    },
    {
      id: "mistral/mistral-small",
      name: "Mistral Small",
      provider: "mistral",
      supportsTools: true,
    },
    { id: "mistral/codestral", name: "Codestral", provider: "mistral" },
  ],
  groq: [
    {
      id: "groq/llama-3.3-70b",
      name: "Llama 3.3 70B",
      provider: "groq",
      supportsTools: true,
    },
    { id: "groq/llama-3.1-8b", name: "Llama 3.1 8B", provider: "groq" },
    { id: "groq/mixtral-8x7b", name: "Mixtral 8x7B", provider: "groq" },
    { id: "groq/gemma2-9b", name: "Gemma 2 9B", provider: "groq" },
  ],
};

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  // Filter to chat models and map to our format
  const chatModels = data.data
    .filter(
      (m: { id: string }) =>
        m.id.startsWith("gpt-") ||
        m.id.startsWith("o1") ||
        m.id.startsWith("o3")
    )
    .map((m: { id: string }) => ({
      id: `openai/${m.id}`,
      name: m.id.replace("gpt-", "GPT-").replace("-turbo", " Turbo"),
      provider: "openai",
      supportsTools: !(m.id.startsWith("o1") || m.id.startsWith("o3")),
      isReasoning: m.id.startsWith("o1") || m.id.startsWith("o3"),
    }));

  return chatModels.length > 0 ? chatModels : FALLBACK_MODELS.openai;
}

function fetchAnthropicModels(): ModelInfo[] {
  // Anthropic doesn't have a public models API, use static list
  return FALLBACK_MODELS.anthropic;
}

function getCachedModels(provider: string): ModelInfo[] | null {
  const cached = modelCache.get(provider);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.models;
  }
  return null;
}

function setCachedModels(provider: string, models: ModelInfo[]): void {
  modelCache.set(provider, { models, timestamp: Date.now() });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "openai";
  const apiKey = searchParams.get("apiKey");

  // Check cache first
  const cached = getCachedModels(provider);
  if (cached) {
    return NextResponse.json({ models: cached, provider, cached: true });
  }

  try {
    let models: ModelInfo[];

    switch (provider) {
      case "openai":
        models = apiKey
          ? await fetchOpenAIModels(apiKey)
          : FALLBACK_MODELS.openai;
        break;
      case "anthropic":
        models = await fetchAnthropicModels();
        break;
      default:
        models = FALLBACK_MODELS[provider] || [];
    }

    setCachedModels(provider, models);
    return NextResponse.json({ models, provider, cached: false });
  } catch (error) {
    // Return fallback on error
    const fallback = FALLBACK_MODELS[provider] || [];
    return NextResponse.json({
      models: fallback,
      provider,
      cached: false,
      error: error instanceof Error ? error.message : "Failed to fetch models",
    });
  }
}
