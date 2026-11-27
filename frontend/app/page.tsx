
"use client";

import { useEffect, useRef, useState } from "react";
import { HistoryPanel } from "@/components/history-panel";
import { Markdown } from "@/components/markdown";
import { API_URL, request } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };
type Chat = { session_id: string; title: string };

// Keep the address bar in sync with the current chat.
function updateUrl(id: string | null) {
  window.history.replaceState(
    null,
    "",
    id ? `?session=${encodeURIComponent(id)}` : window.location.pathname
  );
}

function isRecipeResponse(content: string): boolean {
  const hasIngredients = /^#{0,3}\s*ingredients\b/im.test(content);
  const hasInstructions =
    /^#{0,3}\s*(steps|instructions|directions|method)\b/im.test(content);

  return hasIngredients && hasInstructions;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [savingFavorites, setSavingFavorites] = useState<string[]>([]);
  const [savedFavorites, setSavedFavorites] = useState<string[]>([]);

  // References
  const panelRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Load the list of saved chats.
  async function loadChats() {
    try {
      setChats(await request<Chat[]>("/conversations"));
    } catch {
      setChats([]);
    }
  }

  // Load one saved chat and make it the current conversation.
  async function openChat(id: string) {
    try {
      stickToBottom.current = true;

      const data = await request<Message[]>(
        `/history/${encodeURIComponent(id)}`
      );

      setMessages(data);
      setSessionId(id);
      setHistoryError("");
      updateUrl(id);
    } catch {
      setMessages([
        { role: "assistant", content: "Couldn't load that chat." },
      ]);
      setSessionId(null);
      updateUrl(null);
      setHistoryError("Couldn't load that conversation.");
    }
  }

  // Start a fresh conversation.
  function newChat() {
    if (loading) return;

    setMessages([]);
    setSessionId(null);
    setHistoryError("");
    setShowScrollButton(false);
    updateUrl(null);
  }

  // Delete a saved chat after confirmation.
  async function deleteChat(id: string) {
    try {
      await request(`/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (id === sessionId) {
        setMessages([]);
        setSessionId(null);
        updateUrl(null);
      }

      setHistoryError("");
      await loadChats();
    } catch {
      setHistoryError("Couldn't delete that chat.");
    } finally {
      setPendingDelete(null);
    }
  }

  // Save a recipe to favorites.
  async function saveFavorite(recipeContent: string) {
    if (savingFavorites.includes(recipeContent)) return;
    if (savedFavorites.includes(recipeContent)) return;

    setSavingFavorites((prev) => [...prev, recipeContent]);

    try {
      await request("/favorites/from-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_text: recipeContent }),
      });

      setSavedFavorites((prev) => [...prev, recipeContent]);
    } catch {
      alert("Couldn't save this recipe. Please try again.");
    } finally {
      setSavingFavorites((prev) =>
        prev.filter((content) => content !== recipeContent)
      );
    }
  }

  // Send the user's message and display the chef's reply as it streams in.
  async function send() {
    const text = input.trim();

    if (!text || loading) return;

    stickToBottom.current = true;

    // Display the user's message and an empty assistant message.
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

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      // Get the session ID from the response header.
      const newId = res.headers.get("X-Session-Id");

      if (newId) {
        setSessionId(newId);
        updateUrl(newId);
      }

      // Read the streamed response.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const piece = decoder.decode(value, { stream: true });

        if (piece) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];

            copy[copy.length - 1] = {
              ...last,
              content: last.content + piece,
            };

            return copy;
          });
        }
      }

      // Flush any remaining buffered characters.
      const remaining = decoder.decode();

      if (remaining) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];

          copy[copy.length - 1] = {
            ...last,
            content: last.content + remaining,
          };

          return copy;
        });
      }
    } catch {
      // Replace the incomplete response with an error message.
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "The reply was interrupted. Please send your message again.",
        },
      ]);
    } finally {
      setLoading(false);
      await loadChats();
    }
  }

  // Track whether the user has scrolled away from the latest message.
  function onScroll() {
    const el = scrollRef.current;

    if (!el) return;

    const isAtBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    stickToBottom.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  }

  // Load the chat list and reopen the chat specified in the URL.
  useEffect(() => {
    async function initialize() {
      await loadChats();

      const id = new URLSearchParams(window.location.search).get("session");

      if (id) {
        await openChat(id);
      }
    }

    initialize();
  }, []);

  // Automatically scroll when new messages arrive if the user is at the bottom.
  useEffect(() => {
    const el = scrollRef.current;

    if (el && stickToBottom.current) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages]);

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h1 className="text-lg font-semibold">🍳 Chef Assistant</h1>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={newChat}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            New chat
          </button>

          <button
            type="button"
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
      <div className="relative min-h-0 flex-1">
        {/* Scrollable message area */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto p-4 md:p-6"
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
                  {m.role === "assistant" ? (
                    <>
                      <Markdown>{m.content}</Markdown>

                      {!(loading && i === messages.length - 1) &&
                        isRecipeResponse(m.content) && (
                          <div className="mt-3 border-t border-stone-100 pt-2 dark:border-stone-700">
                            <button
                              type="button"
                              onClick={() => saveFavorite(m.content)}
                              disabled={
                                savingFavorites.includes(m.content) ||
                                savedFavorites.includes(m.content)
                              }
                              className="text-sm text-stone-500 transition hover:text-amber-600 disabled:cursor-default disabled:opacity-70 dark:text-stone-400"
                            >
                              {savedFavorites.includes(m.content)
                                ? "♥ Saved"
                                : savingFavorites.includes(m.content)
                                  ? "Saving..."
                                  : "♡ Favorite"}
                            </button>
                          </div>
                        )}
                    </>
                  ) : (
                    m.content
                  )}
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

        {/* Floating scroll-to-bottom button */}
        {showScrollButton && (
          <button
            type="button"
            onClick={() => {
              stickToBottom.current = true;

              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
              });
            }}
            aria-label="Scroll to latest message"
            title="Scroll to latest message"
            className="absolute bottom-5 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-lg transition hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            ↓
          </button>
        )}
      </div>

      {/* Input row */}
      <div className="shrink-0 border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What are we cooking?"
            aria-label="Message the chef"
          />

          <button
            type="button"
            className="rounded-xl bg-amber-600 px-5 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            onClick={send}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>

      {/* Chat history panel */}
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
