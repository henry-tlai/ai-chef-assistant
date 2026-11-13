"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HistoryPanel } from "@/components/history-panel";
import { Markdown } from "@/components/markdown";

const API_URL = "http://127.0.0.1:8000";

type Message = { role: "user" | "assistant"; content: string };
type Chat = { session_id: string; title: string };

// Keep the address bar in sync with the current chat, so a reload finds it again.
function updateUrl(id: string | null) {
  window.history.replaceState(null, "", id ? `?session=${id}` : window.location.pathname);
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState("");

  // References
  const panelRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);   
  const stickToBottom = useRef(true);              

  // Ask the backend for the list of saved chats.
  async function loadChats() {
    try {
      const res = await fetch(`${API_URL}/conversations`);
      if (!res.ok) throw new Error("Request failed");
      setChats(await res.json());
    } catch {
      setChats([]);
    }
  }

  // Load one saved chat's messages and make it the current conversation.
  async function openChat(id: string) {
    try {
      const res = await fetch(`${API_URL}/history/${id}`);
      if (!res.ok) throw new Error("Request failed");
      stickToBottom.current = true;
      setMessages(await res.json());
      setSessionId(id);
      updateUrl(id);
    } catch {
      setMessages([{ role: "assistant", content: "Couldn't load that chat." }]);
    }
  }

  // Start a fresh conversation: clear the screen, the session id, and the URL.
  function newChat() {
    if (loading) return;
    setMessages([]);
    setSessionId(null);
    updateUrl(null);
  }

  // Delete a saved chat. Only called after the user confirms.
  async function deleteChat(id: string) {
    try {
      const res = await fetch(`${API_URL}/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      if (id === sessionId) {
        // Deleted the chat we are viewing, so reset the screen and the URL too.
        setMessages([]);
        setSessionId(null);
        updateUrl(null);
      }
      setHistoryError("");
      loadChats();
    } catch {
      setHistoryError("Couldn't delete that chat.");
    } finally {
      setPendingDelete(null);
    }
  }

  // Send the user's message and show the chef's reply as it streams in.
  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    stickToBottom.current = true;

    // Show the user's message now, plus an empty assistant bubble to fill in.
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

      // The session id arrives in a response header, before the text starts.
      const newId = res.headers.get("X-Session-Id");
      if (newId) {
        setSessionId(newId);
        updateUrl(newId);
      }

      // Read the reply piece by piece and append each piece to the last message.
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
      // Replace the half-written bubble with an error message.
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "The reply was interrupted. Please send your message again.",
        },
      ]);
    } finally {
      setLoading(false);
      loadChats(); // a new chat only exists in the database after its first reply
    }
  }

  function onScroll() {
  const el = scrollRef.current;
  if (!el) return;

  stickToBottom.current = 
    el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // When the page first opens: load the chat list, and reopen the chat named in the URL.
  useEffect(() => {
    loadChats();
    const id = new URLSearchParams(window.location.search).get("session");
    if (id) openChat(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;

    if (el && stickToBottom.current){
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages]);
  
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Header: title, New chat, and the History button */}
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h1 className="text-lg font-semibold">🍳 Chef Assistant</h1>
        <div className="flex gap-2">
          <button
            onClick={newChat}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            New chat
          </button>
          <button
            onClick={() => panelRef.current?.showModal()}
            disabled={loading}
            aria-haspopup="dialog"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            History
          </button>
        </div>
      </header>

      {historyError && (
        <p role="alert" className="px-4 py-2 text-sm text-red-500">
          {historyError}
        </p>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, i) => {
            if (m.role === "assistant" && m.content === "") return null;
            return (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-amber-600 px-4 py-2 text-white shadow-sm"
                    : "max-w-[85%] self-start break-words rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-2 shadow-sm dark:border-stone-700 dark:bg-stone-800"
                }
              >
                {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.content === "" && (
            <div className="animate-pulse self-start text-sm text-stone-500">
              Chef is thinking...
            </div>
          )}
        </div>
      </div>

      {/* Input row, pinned at the bottom */}
      <div className="shrink-0 border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="What are we cooking?"
            aria-label="Message the chef"
          />
          <button
            className="rounded-xl bg-amber-600 px-5 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            onClick={send}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>

      {/* History panel: a bottom sheet on phones, a side panel on desktop */}
      <HistoryPanel
        ref={panelRef}
        chats={chats}
        currentId={sessionId}
        pendingId={pendingDelete}
        onOpen={(id) => {
          openChat(id);
          panelRef.current?.close();
        }}
        onAskDelete={setPendingDelete}
        onConfirmDelete={deleteChat}
        onCancelDelete={() => setPendingDelete(null)}
      />
    </div>
  );
}