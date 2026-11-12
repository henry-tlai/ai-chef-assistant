"use client";

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Message = { role: "user" | "assistant"; content: string };
type Chat = { session_id: string; title: string };
type Favorite = { id: number; title: string };

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
  const [sidebarError, setSidebarError] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pendingFavDelete, setPendingFavDelete] = useState<number | null>(null);
  const [favError, setFavError] = useState("");

  // Ask the backend for the list of saved chats and show it in the sidebar.
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
      setSidebarError("");
      loadChats();
    } catch {
      setSidebarError("Couldn't delete that chat.");
    } finally {
      setPendingDelete(null);
    }
  }

  // Ask the backend for the saved favorites and show them in the sidebar.
  async function loadFavorites() {
    try {
      const res = await fetch(`${API_URL}/favorites`);
      if (!res.ok) throw new Error("Request failed");
      setFavorites(await res.json());
    } catch {
      setFavorites([]);
    }
  }

  // Delete a favorite. Only called after the user confirms.
  async function deleteFavorite(id: number) {
    try {
      const res = await fetch(`${API_URL}/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setFavError("");
      loadFavorites();
    } catch {
      setFavError("Couldn't delete that favorite.");
    } finally {
      setPendingFavDelete(null);
    }
  }

  // Send the user's message and show the chef's reply as it streams in.
  async function send() {
    const text = input.trim();
    if (!text || loading) return;

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
      loadFavorites(); // the chef may have saved a recipe during this reply
    }
  }

  // When the page first opens: load the sidebar, and reopen the chat named in the URL.
  useEffect(() => {
    loadChats();
    loadFavorites();
    const id = new URLSearchParams(window.location.search).get("session");
    if (id) openChat(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar: new chat button and saved chats */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-gray-700 p-4">
        <button
          onClick={newChat}
          disabled={loading}
          className="mb-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          New chat
        </button>

        <h2 className="mb-3 text-lg font-semibold">Chats</h2>
        {sidebarError && <p className="mb-2 text-sm text-red-500">{sidebarError}</p>}

        <div className="flex flex-col gap-1">
          {chats.map((c) => (
            <div key={c.session_id} className="flex items-center gap-1">
              {pendingDelete === c.session_id ? (
                // Confirmation row: nothing is deleted until the user clicks Yes.
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
                    className="rounded border border-gray-500 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                // Normal row: the chat title and a small delete button.
                <>
                  <button
                    onClick={() => openChat(c.session_id)}
                    disabled={loading}
                    className={
                      "flex-1 truncate rounded px-2 py-1 text-left disabled:opacity-50 " +
                      (c.session_id === sessionId
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-200 hover:text-black")
                    }
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => setPendingDelete(c.session_id)}
                    disabled={loading}
                    aria-label="Delete chat"
                    className="rounded px-2 py-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    x
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-lg font-semibold">Favorites</h2>
        {favError && <p className="mb-2 text-sm text-red-500">{favError}</p>}
        {favorites.length === 0 && (
          <p className="text-sm text-gray-500">No favorites yet.</p>
        )}

        <div className="flex flex-col gap-1">
          {favorites.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              {pendingFavDelete === f.id ? (
                // Confirmation row: nothing is deleted until the user clicks Yes.
                <div className="flex flex-1 items-center gap-2 text-sm">
                  <span className="flex-1">Delete this favorite?</span>
                  <button
                    onClick={() => deleteFavorite(f.id)}
                    className="rounded bg-red-600 px-2 py-1 text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPendingFavDelete(null)}
                    className="rounded border border-gray-500 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                // Normal row: the recipe title and a small delete button.
                <>
                  <span className="flex-1 truncate px-2 py-1">{f.title}</span>
                  <button
                    onClick={() => setPendingFavDelete(f.id)}
                    aria-label="Delete favorite"
                    className="rounded px-2 py-1 text-gray-400 hover:text-red-500"
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