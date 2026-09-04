import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AskChat } from "@/components/ask-chat";

export function AskWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[60] flex h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-3xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Ask deposit</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AskChat compact className="min-h-0 flex-1" />
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close the deposit assistant" : "Ask the deposit assistant"}
        className="fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
