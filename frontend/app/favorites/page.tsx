
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/api";
import { ConfirmRow } from "@/components/ui/confirm-row";

type Favorite = {
  id: number;
  title: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // Load saved recipes when the page opens.
  useEffect(() => {
    async function loadFavorites() {
      try {
        const data = await request<Favorite[]>("/favorites");
        setFavorites(data);
      } catch {
        setError("Unable to load your saved recipes.");
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  // Delete a saved recipe.
  async function handleDelete(favoriteId: number) {
    try {
      await request<{ deleted: number }>(
        `/favorites/${favoriteId}`,
        { method: "DELETE" }
      );

      setFavorites((currentFavorites) =>
        currentFavorites.filter(
          (favorite) => favorite.id !== favoriteId
        )
      );

      setConfirmingId(null);
      setError("");
    } catch {
      setError("Unable to delete this recipe. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-stone-500 dark:text-stone-400">
        Loading saved recipes...
      </div>
    );
  }

  return (
    <section className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Favorite Recipes
          </h1>

          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Your saved recipes, ready whenever you want to cook.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {favorites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
            <h2 className="font-semibold text-stone-800 dark:text-stone-200">
              No saved recipes yet
            </h2>

            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Ask your AI chef for a recipe and save your favorites here.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Go to Chat
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favorites.map((favorite) => (
              <article
                key={favorite.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                  {favorite.title}
                </h2>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link
                    href={`/favorites/${favorite.id}`}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Start Cooking
                  </Link>

                  {confirmingId === favorite.id ? (
                    <ConfirmRow
                      label="Delete this recipe?"
                      onConfirm={() => handleDelete(favorite.id)}
                      onCancel={() => setConfirmingId(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setConfirmingId(favorite.id)}
                      className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
