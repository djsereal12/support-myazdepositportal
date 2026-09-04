import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles } from "lucide-react";

export const SUGGESTED_QUESTIONS = [
  "How long does my landlord have to return my deposit?",
  "What counts as normal wear and tear in Arizona?",
  "How do I send my report to my landlord?",
  "My landlord kept my deposit — what do I do?",
];

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function AskChat({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (e) =>
      setError(
        e.message.includes("402")
          ? "The assistant is out of credits right now. Email support@myazdepositportal.live and we'll answer personally."
          : "The assistant couldn't answer just now. Please try again in a moment.",
      ),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function ask(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setError(null);
    setInput("");
    void sendMessage({ text: value });
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 ${compact ? "" : "py-2"}`}
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask anything about Arizona security deposits or how deposit works.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="glass rounded-full px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const body = textOf(message);
          const mine = message.role === "user";
          if (!body) return null;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  mine ? "bg-foreground text-background" : "glass text-foreground"
                }`}
              >
                {mine ? (
                  body
                ) : (
                  <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-strong:text-foreground">
                    <ReactMarkdown>{body}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Thinking…
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          aria-label="Ask a question"
          className="glass h-11 flex-1 rounded-full px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
          aria-label="Send question"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 text-[0.68rem] text-muted-foreground">
        General information, not legal advice.
      </p>
    </div>
  );
}
