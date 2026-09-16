"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/chat-actions";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export function ChatThread({
  threadId,
  initialMessages,
  currentAuthor,
  currentAuthorName,
  otherName,
}: {
  threadId: string;
  initialMessages: ChatMessage[];
  currentAuthor: "familia" | "professor";
  currentAuthorName: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setText("");
    setMessages((m) => [
      ...m,
      {
        id: `local-${Date.now()}`,
        threadId,
        autor: currentAuthor,
        autorNom: currentAuthorName,
        text: trimmed,
        data: new Date().toISOString(),
      },
    ]);

    startTransition(async () => {
      const result = await sendMessage(threadId, trimmed);
      if (!result.success) {
        setError(result.error ?? "No s'ha pogut enviar el missatge.");
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col md:h-[calc(100dvh-8rem)]">
      <div className="border-b border-border pb-3">
        <p className="font-bold">{otherName}</p>
        <p className="text-xs text-muted">Normalment respon en menys d&apos;un dia</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((m) => {
          const mine = m.autor === currentAuthor;
          return (
            <div
              key={m.id}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                  mine
                    ? "rounded-br-sm bg-arkedia-blue text-white"
                    : "rounded-bl-sm bg-black/[0.05] text-foreground"
                )}
              >
                {m.text}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted">
                {new Date(m.data).toLocaleTimeString("ca-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="pt-6 text-center text-sm text-muted">
            Encara no hi ha cap missatge. Digues hola!
          </p>
        )}
      </div>

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escriu un missatge..."
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20"
        />
        <button
          onClick={send}
          aria-label="Enviar"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arkedia-blue text-white disabled:opacity-40"
          disabled={!text.trim() || pending}
        >
          <Send className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
