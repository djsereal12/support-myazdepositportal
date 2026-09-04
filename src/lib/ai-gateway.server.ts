import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Server-only helper connecting the AI SDK to the Lovable AI Gateway.
 * Never import from client components.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}
