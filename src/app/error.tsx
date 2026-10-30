"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-6xl">The page could not be opened.</h1>
      <button type="button" onClick={reset} className="mt-6 border border-ink px-5 py-3 text-sm">
        Try again
      </button>
    </div>
  );
}
