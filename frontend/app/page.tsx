"use client";

import { useState, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000";

type Message = { role: "user" | "assistant"; content: string };
type Chat = { session_id: string; title: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [sidebarError, setSidebarError] = useState("")
  

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
      loadChats();
    }
  }

    async function loadChats() {
    try {
      const res = await fetch(`${API_URL}/conversations`);
      if (!res.ok) throw new Error("Request failed");
      setChats(await res.json());
    } catch {
      setChats([]);
    }
  }

  async function openChat(id: string) {
    try {
      const res = await fetch(`${API_URL}/history/${id}`);
      if (!res.ok) throw new Error("Request failed");
      setMessages(await res.json());
      setSessionId(id);
    } catch {
      setMessages([{ role: "assistant", content: "Couldn't load that chat." }]);
    }
  } 

  async function deleteChat(id: string) {
  try {
    const res = await fetch(`${API_URL}/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Request failed");
    if (id === sessionId) {
      setMessages([]);
      setSessionId(null);
      updateUrl(null);
    }
    setSidebarError("");
    loadChats();
  } catch {
    setSidebarError("Couldn't delete that chat.");
  } finally {
    setPendingDelete(null);
  }
}
  useEffect(() => {
    loadChats();
  }, []);

    return (
    <div className="flex h-screen">
      {/* Sidebar: saved chats */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-gray-700 p-4">
        <h2 className="mb-3 text-lg font-semibold">Chats</h2>
        <div className="flex flex-col gap-1">
          {chats.map((c) => (
            <div key={c.session_id} className="flex items-center gap-1">
              {pendingDelete === c.session_id ? (
                <div className="flex flex-1 items-center gap-2 text-sm">
                  <span className="flex-1">Delete this chat?</span>
                  <button
                    onClick={() => deleteChat(c.session_id)}
                    className="rounded bg-red-600 px-2 py-1 text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPendingDelete(null)}
                    className="rounded border px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openChat(c.session_id)}
                    className="flex-1"
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => setPendingDelete(c.session_id)}
                    className="rounded border px-2 py-1"
                  >
                    x
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>
 
      {/* Main column: messages on top, input pinned at the bottom */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            <h1 className="text-2xl font-semibold">Chef Assistant</h1>
 
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
 
            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="self-start text-gray-500">Chef is thinking...</div>
            )}
          </div>
        </div>
 
        <div className="border-t border-gray-700 p-4">
          <div className="mx-auto flex max-w-2xl gap-2">
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
        </div>
      </main>
    </div>
  );
}
 