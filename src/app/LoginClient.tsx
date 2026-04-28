"use client";

import { useRef, useState } from "react";
import { login, validateLogin } from "./actions";

const TROLL_MESSAGES = [
  "Het was just ze, maar doetet toch nog ma ne keer",
  "Jaja das juist, maar bewijst het nog ne keer 💅",
  "Top he, uwe PIN was just, mor omda ge zo lelek zijt moogde da nog is doen, mercikesss",
  "Ne juste! Nog zo eentje 🫡",
];

export default function LoginClient() {
  const [trollMsg, setTrollMsg] = useState<string | null>(null);
  const [trolled, setTrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const pin = formData.get("pin") as string;

    setError(null);

    // Validate credentials
    const result = await validateLogin(name, pin);

    if (!result.valid) {
      setError("Verkeerde PIN of naam, probeer opnieuw");
      return;
    }

    // If player (not admin) and not yet trolled, 30% chance to troll
    if (!result.isAdmin && !trolled && Math.random() < 0.3) {
      const msg = TROLL_MESSAGES[Math.floor(Math.random() * TROLL_MESSAGES.length)];
      setTrollMsg(msg);
      setTrolled(true);
      // Clear the PIN field
      const pinInput = form.querySelector('input[name="pin"]') as HTMLInputElement;
      if (pinInput) pinInput.value = "";
      return;
    }

    // Actually log in
    await login(formData);
  }

  return (
    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
      <h1 className="mb-1 text-center text-3xl font-extrabold text-white">
        🍺 Tenerife 2026
      </h1>
      <p className="mb-6 text-center text-sm text-gray-400">
        Featuring Lander, Berten, Dries en Anton
      </p>

      {trollMsg && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-center text-sm text-amber-300">
          {trollMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-300"
          >
            Wie zijde gij?
          </label>
          <select
            name="name"
            id="name"
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Kiest uwen naam</option>
            <option value="Lander">Lander</option>
            <option value="Berten">Berten</option>
            <option value="Dries">Dries</option>
            <option value="Anton">Anton</option>
            <option value="Hanne">Hanne (Admin)</option>
            <option value="Klaas">Klaas (Admin)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="pin"
            className="mb-1 block text-sm font-medium text-gray-300"
          >
            PIN Code
          </label>
          <input
            type="password"
            name="pin"
            id="pin"
            inputMode="numeric"
            maxLength={4}
            required
            placeholder="4-digit PIN"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-500 py-2.5 font-bold text-black transition hover:bg-amber-400 active:scale-95"
        >
          HUTS!
        </button>
      </form>
    </div>
  );
}
