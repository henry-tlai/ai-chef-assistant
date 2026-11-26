
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { request } from "@/lib/api";

type RecipeStep = {
  text: string;
  timer_seconds: number | null;
  timer_max_seconds: number | null;
  image_url: string | null;
};

type Recipe = {
  id: number;
  title: string;
  servings: number | null;
  total_minutes: number | null;
  ingredients: string[];
  steps: RecipeStep[];
};

function CookingContent() {
  const params = useParams<{ favoriteId: string }>();
  const router = useRouter();
  const favoriteId = params.favoriteId;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Load the selected recipe.
  useEffect(() => {
    let cancelled = false;

    async function loadRecipe() {
      setLoading(true);
      setError("");
      setRecipe(null);
      setCurrentStep(0);
      setTimeLeft(0);
      setSelectedDuration(0);
      setTimerRunning(false);

      try {
        const data = await request<Recipe>(
          `/favorites/${encodeURIComponent(favoriteId)}`
        );

        if (cancelled) return;

        setRecipe(data);

        const initialDuration = data.steps[0]?.timer_seconds ?? 0;

        setSelectedDuration(initialDuration);
        setTimeLeft(initialDuration);
      } catch {
        if (!cancelled) {
          setError("Unable to load this recipe.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [favoriteId]);

  // Run the countdown once per second while the timer is active.
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setTimerRunning(false);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning, timeLeft]);

  // Reset the timer when moving to another cooking step.
  function goToStep(stepIndex: number) {
    if (!recipe || stepIndex < 0 || stepIndex >= recipe.steps.length) {
      return;
    }

    const duration = recipe.steps[stepIndex].timer_seconds ?? 0;

    setCurrentStep(stepIndex);
    setSelectedDuration(duration);
    setTimeLeft(duration);
    setTimerRunning(false);
  }

  if (loading) {
    return (
      <div role="status" className="p-6 text-stone-500 dark:text-stone-400">
        Loading recipe...
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <section className="p-6">
        <p role="alert" className="text-red-600">
          {error || "Recipe not found."}
        </p>

        <Link href="/favorites" className="mt-4 inline-block underline">
          Back to Favorites
        </Link>
      </section>
    );
  }

  if (recipe.steps.length === 0) {
    return (
      <section className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/favorites"
            className="mb-6 inline-block text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            ← Back to Favorites
          </Link>

          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            {recipe.title}
          </h1>

          <p className="mt-6 text-stone-500 dark:text-stone-400">
            This recipe does not have any cooking instructions.
          </p>
        </div>
      </section>
    );
  }

  const step = recipe.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === recipe.steps.length - 1;

  const baseTimer = step.timer_seconds;
  const maxTimer = step.timer_max_seconds;

  const timerOptions =
    baseTimer !== null && maxTimer !== null && maxTimer > baseTimer
      ? Array.from(
          {
            length: Math.floor((maxTimer - baseTimer) / 60) + 1,
          },
          (_, index) => baseTimer + index * 60
        )
      : [];

  return (
    <section className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/favorites"
          className="mb-6 inline-block text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
        >
          ← Back to Favorites
        </Link>

        <header>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            {recipe.title}
          </h1>

          <div className="mt-2 flex gap-4 text-sm text-stone-500 dark:text-stone-400">
            {recipe.servings !== null && (
              <span>{recipe.servings} servings</span>
            )}

            {recipe.total_minutes !== null && (
              <span>{recipe.total_minutes} minutes</span>
            )}
          </div>
        </header>

        {/* Ingredients */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Ingredients</h2>

          <ul className="mt-3 list-disc space-y-2 pl-5">
            {recipe.ingredients.map((ingredient, index) => (
              <li
                key={`${index}-${ingredient}`}
                className="text-stone-700 dark:text-stone-300"
              >
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        {/* Cooking instructions */}
        <div className="mt-10 rounded-xl border border-stone-200 p-6 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cooking Instructions</h2>

            <span className="text-sm text-stone-500 dark:text-stone-400">
              Step {currentStep + 1} of {recipe.steps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
            role="progressbar"
            aria-label="Cooking progress"
            aria-valuemin={1}
            aria-valuemax={recipe.steps.length}
            aria-valuenow={currentStep + 1}
          >
            <div
              className="h-full rounded-full bg-amber-600"
              style={{
                width: `${((currentStep + 1) / recipe.steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Current step */}
          <div className="mt-8">
            <p className="text-lg leading-relaxed text-stone-800 dark:text-stone-200">
              {step.text}
            </p>

            {/* Step timer */}
            {step.timer_seconds !== null && step.timer_seconds > 0 && (
              <div className="mt-6 rounded-lg bg-stone-100 p-4 dark:bg-stone-800">
                <p className="text-center text-sm text-stone-500 dark:text-stone-400">
                  Step Timer
                </p>

                {timerOptions.length > 1 && (
                  <div className="mt-4">
                    <p className="mb-2 text-center text-sm text-stone-500 dark:text-stone-400">
                      Choose your starting duration
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                      {timerOptions.map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => {
                            setTimerRunning(false);
                            setSelectedDuration(duration);
                            setTimeLeft(duration);
                          }}
                          disabled={timerRunning}
                          aria-pressed={selectedDuration === duration}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            selectedDuration === duration
                              ? "border-amber-600 bg-amber-100 text-amber-900"
                              : "border-stone-300 dark:border-stone-600"
                          } disabled:opacity-50`}
                        >
                          {Math.floor(duration / 60)} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p
                  role="timer"
                  aria-label="Time remaining"
                  aria-live="off"
                  className="my-3 text-center text-3xl font-bold tabular-nums"
                >
                  {Math.floor(timeLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </p>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerRunning((running) => !running)}
                    disabled={timeLeft === 0}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {timerRunning ? "Pause" : "Start"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(selectedDuration);
                    }}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm dark:border-stone-600"
                  >
                    Reset
                  </button>
                </div>

                {timeLeft === 0 && (
                  <div className="mt-3 text-center">
                    <p
                      role="status"
                      className="text-sm font-medium text-green-600"
                    >
                      Timer complete!
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDuration((duration) => duration + 60);
                        setTimeLeft(60);
                        setTimerRunning(true);
                      }}
                      className="mt-3 rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300"
                    >
                      Add 1 more minute
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              disabled={isFirstStep}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-stone-600"
            >
              Previous
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => router.push("/favorites")}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Finish Cooking
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CookingPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="p-6 text-stone-500 dark:text-stone-400">
          Loading recipe...
        </div>
      }
    >
      <CookingContent />
    </Suspense>
  );
}
