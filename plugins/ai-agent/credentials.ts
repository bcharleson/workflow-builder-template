/**
 * AI Agent Credentials
 *
 * Supports multiple AI provider API keys for maximum flexibility.
 * Users can configure credentials for any providers they want to use.
 */
export type AiAgentCredentials = {
  // Vercel AI Gateway (universal key that works with all providers via Vercel)
  AI_GATEWAY_API_KEY?: string;

  // Direct provider API keys (for users who prefer direct access)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GROQ_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  XAI_API_KEY?: string;

  // Meta/Llama models are typically accessed via other providers (Groq, Together, etc.)
  // or via Vercel AI Gateway, so no separate key needed
};

/**
 * Get the appropriate API key for a given provider
 * Falls back to AI Gateway key if provider-specific key is not available
 */
export function getProviderApiKey(
  credentials: AiAgentCredentials,
  provider: string
): string | undefined {
  // First check for provider-specific key
  switch (provider) {
    case "openai":
      if (credentials.OPENAI_API_KEY) return credentials.OPENAI_API_KEY;
      break;
    case "anthropic":
      if (credentials.ANTHROPIC_API_KEY) return credentials.ANTHROPIC_API_KEY;
      break;
    case "google":
      if (credentials.GOOGLE_API_KEY) return credentials.GOOGLE_API_KEY;
      break;
    case "groq":
      if (credentials.GROQ_API_KEY) return credentials.GROQ_API_KEY;
      break;
    case "mistral":
      if (credentials.MISTRAL_API_KEY) return credentials.MISTRAL_API_KEY;
      break;
    case "xai":
      if (credentials.XAI_API_KEY) return credentials.XAI_API_KEY;
      break;
  }

  // Fall back to AI Gateway key (works with all providers via Vercel)
  return credentials.AI_GATEWAY_API_KEY;
}

