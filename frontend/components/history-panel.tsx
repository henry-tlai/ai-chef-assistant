"use client";

import { forwardRef } from "react";
import { ConfirmRow } from "@/components/ui/confirm-row";

export type Chat = { session_id: string; title: string };

type Props = {
  chats: Chat[];
  currentId: string | null;
  pendingId: string | null;
  onOpen: (id: string) => void;
  onAskDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

// A panel listing saved chats. It is a native <dialog>, so the browser handles
// focus trapping, the Escape key, and making the rest of the page inert.
// The page owns all the data and passes it in; this component only draws it.
export const HistoryPanel = forwardRef<HTMLDialogElement, Props>(function HistoryPanel(
  { chats, currentId, pendingId, onOpen, onAskDelete, onConfirmDelete, onCancelDelete },
  ref
) {
  return (
    <dialog
      ref={ref}
      aria-label="Chat history"
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[75dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-white p-4 text-stone-900 backdrop:bg-black/40 md:inset-y-0 md:left-auto md:right-0 md:top-0 md:h-dvh md:max-h-none md:w-80 md:rounded-none md:rounded-l-2xl dark:bg-stone-900 dark:text-stone-100"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        {/* A form with method="dialog" closes the dialog natively, no ref needed. */}
        <form method="dialog">
          <button className="rounded-lg border border-stone-300 px-3 py-1 text-sm transition hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">
            Close
          </button>
        </form>
      </div>

      {chats.length === 0 ? (
        <p className="text-sm text-stone-500">No chats yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {chats.map((c) => (
            <li key={c.session_id}>
              {pendingId === c.session_id ? (
                <ConfirmRow
                  label="Delete this chat?"
                  onConfirm={() => onConfirmDelete(c.session_id)}
                  onCancel={onCancelDelete}
                />
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpen(c.session_id)}
                    aria-current={c.session_id === currentId ? "true" : undefined}
                    className={
                      "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition " +
                      (c.session_id === currentId
                        ? "bg-amber-100 font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                        : "hover:bg-stone-100 dark:hover:bg-stone-800")
                    }
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => onAskDelete(c.session_id)}
                    aria-label={`Delete chat: ${c.title}`}
                    className="rounded px-2 py-1 text-stone-400 transition hover:text-red-500"
                  >
                    x
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
});