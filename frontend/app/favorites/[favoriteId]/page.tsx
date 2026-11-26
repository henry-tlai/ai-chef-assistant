
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { request } from "@/lib/api";

type RecipeStep = {
    text: string;
    timer_seconds: number | null;
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

export default function CookingPage() {
    const params = useParams<{ favoriteId: string }>();
    const router = useRouter();

    const favoriteId = params.favoriteId;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentStep, setCurrentStep] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);

    // Countdown the timer when it's running.
    useEffect(() => {
    if (!timerRunning || timeLeft <= 0) {
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft((currentTime) => {
            if (currentTime <= 1) {
                setTimerRunning(false);
                return 0;
            }
        
        return currentTime - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
    }, [timerRunning, timeLeft]);

    useEffect(() => {
    async function loadRecipe() {
        try {
            const data = await request<Recipe>(`/favorites/${favoriteId}`);
            setRecipe(data);
            setTimeLeft(data.steps[0]?.timer_seconds ?? 0);
        } catch {
            setError("Unable to load this recipe.");
        } finally {
            setLoading(false);
        }
    }

    loadRecipe();
    }, [favoriteId]);

    if (loading) {
        return <div className="p-6 text-stone-500">Loading recipe...</div>;
    }

    if (error || !recipe) {
    return (
        <section className="p-6">
        <p className="text-red-600">{error || "Recipe not found."}</p>
        <Link href="/favorites" className="mt-4 inline-block underline">
            Back to Favorites
        </Link>
        </section>
    );
    }

    const step = recipe.steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === recipe.steps.length - 1;

    return (
    <section className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
        <button
            onClick={() => router.push("/favorites")}
            className="mb-6 text-sm text-stone-500 hover:text-stone-900"
        >
            ← Back to Favorites
        </button>

        <header>
            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            {recipe.title}
            </h1>

            <div className="mt-2 flex gap-4 text-sm text-stone-500">
            {recipe.servings !== null && (
                <span>{recipe.servings} servings</span>
            )}

            {recipe.total_minutes !== null && (
                <span>{recipe.total_minutes} minutes</span>
            )}
            </div>
        </header>

        <div className="mt-8">
            <h2 className="text-xl font-semibold">Ingredients</h2>

            <ul className="mt-3 space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="text-stone-700 dark:text-stone-300">
                • {ingredient}
                </li>
            ))}
            </ul>
        </div>

        <div className="mt-10 rounded-xl border border-stone-200 p-6 dark:border-stone-700">
            <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cooking Instructions</h2>

            <span className="text-sm text-stone-500">
                Step {currentStep + 1} of {recipe.steps.length}
            </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
            <div
                className="h-full rounded-full bg-amber-600"
                style={{
                width: `${((currentStep + 1) / recipe.steps.length) * 100}%`,
                }}
            />
            </div>

            <p className="mt-8 text-lg leading-relaxed text-stone-800 dark:text-stone-200">
            {step.text}
            {step.timer_seconds !== null && step.timer_seconds > 0 && (
            <div className="mt-6 rounded-lg bg-stone-100 p-4 dark:bg-stone-800">
                <p className="text-center text-sm text-stone-500">
                Step Timer
                </p>

                <p className="my-3 text-center text-3xl font-bold tabular-nums">
                {Math.floor(timeLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                :
                {(timeLeft % 60).toString().padStart(2, "0")}
                </p>

                <div className="flex justify-center gap-3">
                <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    disabled={timeLeft === 0}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                    {timerRunning ? "Pause" : "Start"}
                </button>

                <button
                    onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(step.timer_seconds ?? 0);
                    }}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm dark:border-stone-600"
                >
                    Reset
                </button>
                </div>

                {timeLeft === 0 && (
                <p className="mt-3 text-center text-sm font-medium text-green-600">
                    Timer complete!
                </p>
                )}
            </div>
            )}
            </p>

            <div className="mt-8 flex items-center justify-between">
            <button
                onClick={() => {
                    const nextStep = currentStep - 1;
                    setCurrentStep(nextStep);
                    setTimeLeft(recipe.steps[nextStep].timer_seconds ?? 0);
                    setTimerRunning(false);
                }}
                disabled={isFirstStep}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-stone-600"
            >
                Previous
            </button>

            {isLastStep ? (
                <button
                onClick={() => router.push("/favorites")}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                Finish Cooking
                </button>
            ) : (
                <button
                onClick={() => {
                    const nextStep = currentStep + 1;
                    setCurrentStep(nextStep);
                    setTimeLeft(recipe.steps[nextStep].timer_seconds ?? 0);
                    setTimerRunning(false);
                }}
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
