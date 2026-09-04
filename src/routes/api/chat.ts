import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant-prompt";

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        // Keep the context bounded — this is a support bot, not a long agent.
        const trimmed = (messages as UIMessage[]).slice(-20);

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3.7-flash"),
            system: ASSISTANT_SYSTEM_PROMPT,
            messages: await convertToModelMessages(trimmed),
          });
          return result.toUIMessageStreamResponse({ originalMessages: trimmed });
        } catch (error) {
          const status =
            typeof error === "object" && error && "statusCode" in error
              ? Number((error as { statusCode?: number }).statusCode) || 500
              : 500;
          const message = error instanceof Error ? error.message : "Assistant unavailable";
          console.error(`Chat request failed [${status}]: ${message}`);
          return new Response(message, { status });
        }
      },
    },
  },
});
