import React from "react";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center">
      <section className="retro-card retro-scanlines p-6 max-w-lg w-full" role="alert" aria-live="assertive">
        <header>
          <h1 className="retro-title text-lg">404 — Page Not Found</h1>
          <p className="text-sm retro-muted mt-2">
            The page you’re looking for doesn’t exist.
          </p>
        </header>
      </section>
    </main>
  );
}
