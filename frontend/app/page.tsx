"use client";

import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
  const text = input.trim();
  if (!text || loading) return;

  setMessages((prev) => [
    ...prev,
    { role: "user", content: text },
    { role: "assistant", content: "" },
  ]);
  setInput("");
  setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {                    
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const newId = res.headers.get("X-Session-Id");                          
      if (newId) setSessionId(newId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + piece };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "The reply was interrupted. Please send your message again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Chef Assistant</h1>

      <div className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => {
          if (m.role === "assistant" && m.content === "") return null;
          return (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end whitespace-pre-wrap rounded-lg bg-blue-600 px-3 py-2 text-white"
                  : "self-start whitespace-pre-wrap rounded-lg bg-gray-200 px-3 py-2 text-black"
              }
            >
              {m.content}
            </div>
          );
        })}
        {loading && <div className="self-start text-gray-500">Chef is thinking...</div>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What are we cooking?"
        />
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          onClick={send}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </main>
  );
}