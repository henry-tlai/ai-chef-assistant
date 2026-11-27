
"use client";

import { forwardRef } from "react";
import { ConfirmRow } from "@/components/ui/confirm-row";

export type Chat = {
  session_id: string;
  title: string;
};

type Props = {
  chats: Chat[];
  currentId: string | null;
  pendingId: string | null;
  onOpen: (id: string) => void;
  onAskDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

// A native dialog that displays saved chats.
// The parent component owns the chat data and actions.
export const HistoryPanel = forwardRef<HTMLDialogElement, Props>(
  function HistoryPanel(
    {
      chats,
      currentId,
      pendingId,
      onOpen,
      onAskDelete,
      onConfirmDelete,
      onCancelDelete,
    },
    ref
  ) {
    return (
      <dialog
        ref={ref}
        aria-labelledby="history-heading"
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[75dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-white p-4 text-stone-900 backdrop:bg-black/40 md:inset-y-0 md:left-auto md:right-0 md:top-0 md:h-dvh md:max-h-none md:w-80 md:rounded-none md:rounded-l-2xl dark:bg-stone-900 dark:text-stone-100"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="history-heading" className="text-lg font-semibold">
            History
          </h2>

          {/* Native dialog form closes the panel. */}
          <form method="dialog">
            <button
              type="submit"
              aria-label="Close chat history"
              className="rounded-lg border border-stone-300 px-3 py-1 text-sm transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Close
            </button>
          </form>
        </div>

        {chats.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No chats yet.
          </p>
        ) : (
          <ul aria-label="Saved conversations" className="flex flex-col gap-1">
            {chats.map((chat) => (
              <li key={chat.session_id}>
                {pendingId === chat.session_id ? (
                  <ConfirmRow
                    label="Delete this chat?"
                    onConfirm={() => onConfirmDelete(chat.session_id)}
                    onCancel={onCancelDelete}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpen(chat.session_id)}
                      aria-current={
                        chat.session_id === currentId ? "page" : undefined
                      }
                      className={
                        "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 " +
                        (chat.session_id === currentId
                          ? "bg-amber-100 font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                          : "hover:bg-stone-100 dark:hover:bg-stone-800")
                      }
                    >
                      {chat.title}
                    </button>

                    <button
                      type="button"
                      onClick={() => onAskDelete(chat.session_id)}
                      aria-label={`Delete chat: ${chat.title}`}
                      className="rounded px-2 py-1 text-stone-400 transition hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    >
                      <span aria-hidden="true">x</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </dialog>
    );
  }
);
