"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-hover"
      >
        <div className="mb-6">
          <span className="font-display text-2xl font-extrabold tracking-tight text-purple">
            DD
          </span>
          <p className="mt-1 text-sm text-mute">
            DevOpsDays Lima 2026 — Speaker Dashboard
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          required
          autoFocus
          autoComplete="username"
          className="mb-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-purple"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-purple"
        />

        {state?.error && (
          <p className="mb-4 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple px-4 py-2.5 font-medium text-white transition-colors hover:bg-purple-deep disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
