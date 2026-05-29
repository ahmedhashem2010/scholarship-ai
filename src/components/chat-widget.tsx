"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User as UserIcon } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "How do I improve my personal statement?",
  "Which scholarship should I apply to first?",
  "What documents do I need for MEXT?",
  "How long does the application take?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || loading) return;

    setShowPrompts(false);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: json.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please check your network and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 sm:w-96 flex-col rounded-xl border bg-white shadow-2xl animate-fade-in-up overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-700 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 hover:bg-white/20 transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80" style={{ minHeight: "200px" }}>
        {messages.length === 0 && showPrompts ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">Hi! I&apos;m your scholarship coach.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ask me anything about scholarships, applications, or documents.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-primary-100" : "bg-slate-100"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-slate-600" />
                )}
              </div>
              <div
                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-slate-100 text-foreground rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Bot className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-muted-foreground rounded-tl-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground text-center">
          Powered by Gemini · Your data is private
        </p>
      </div>
    </div>
  );
}
