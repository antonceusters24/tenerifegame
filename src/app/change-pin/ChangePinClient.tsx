"use client";

import { useState } from "react";
import { changePin } from "../actions";

type User = { id: string; name: string; role: string };

export default function ChangePinClient({ user }: { user: User }) {
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await changePin(form);
    if (res && "error" in res) {
      setError(res.error!);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
        <h1 className="mb-1 text-center text-2xl font-extrabold text-white">
          🔐 Kiest auwe PIN
        </h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Hup jom {user.name} kiest ne nieuwe 4-cijfer PIN.
        </p>
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new_pin"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Nieuwe PIN
            </label>
            <input
              type="password"
              name="new_pin"
              id="new_pin"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="4 getallekes"
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_pin"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Bevestig PIN
            </label>
            <input
              type="password"
              name="confirm_pin"
              id="confirm_pin"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="Opnieuw ze hup"
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-2.5 font-bold text-black transition hover:bg-amber-400 active:scale-95"
          >
            PIN OEPSLAGE 💪
          </button>
        </form>
      </div>
    </div>
  );
}
