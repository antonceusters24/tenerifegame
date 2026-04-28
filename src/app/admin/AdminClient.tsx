"use client";

import { useState } from "react";
import { User, Category } from "@/lib/types";
import { addChallenge, deleteChallenge, logout } from "../actions";
import Link from "next/link";

type ChallengeWithCat = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  requires_target: boolean;
  categories: { name: string } | null;
};

export default function AdminClient({
  user,
  categories,
  challenges: initialChallenges,
}: {
  user: User;
  categories: Category[];
  challenges: ChallengeWithCat[];
}) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [tab, setTab] = useState<"add" | "list">("add");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [requiresTarget, setRequiresTarget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gotchaDesc, setGotchaDesc] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const res = await addChallenge(form);
    if ("error" in res) {
      setMsg(res.error!);
    } else {
      setMsg("Challenge added! 🎉");
      e.currentTarget.reset();
      setRequiresTarget(false);
      setSelectedCategory("");
      setGotchaDesc(false);
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this challenge?")) return;
    await deleteChallenge(id);
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }

  const tabs = [
    { key: "add" as const, label: "➕ Add Challenge" },
    { key: "list" as const, label: `📋 All Challenges (${challenges.length})` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">
            ⚙️ Admin — {user.name}
          </h1>
          <div className="flex gap-2">
            <Link
              href="/gallery"
              className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-slate-700"
            >
              📸
            </Link>
            <Link
              href="/scoreboard"
              className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-slate-700"
            >
              🏆 Scores
            </Link>
            <form action={logout}>
              <button className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm font-medium text-gray-400 transition hover:bg-slate-700">
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Info */}
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <p className="text-sm text-gray-400">
            Voeg challenges toe aan de pool. Ze worden <strong className="text-amber-400">willekeurig toegewezen</strong> aan
            spelers elke dag. Elke challenge kan maar 1 keer gebruikt worden. Categorieën worden gespreid
            zodat max 2 spelers dezelfde soort krijgen per dag.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-amber-500 text-black shadow"
                  : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="mb-4 rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-300">
            {msg}
          </div>
        )}

        {/* Add Challenge */}
        {tab === "add" && (
          <form
            onSubmit={handleAdd}
            className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-lg backdrop-blur"
          >
            <h2 className="text-lg font-bold text-white">
              Add New Challenge
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Category
              </label>
              <select
                name="category_id"
                required
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const cat = categories.find((c) => c.id === e.target.value);
                  if (cat?.name === "Gotcha") {
                    setRequiresTarget(true);
                    setGotchaDesc(true);
                  } else {
                    setGotchaDesc(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                name="title"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-gray-500"
                placeholder="e.g. Secret Word Master"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={gotchaDesc ? "Laat de persoon die wordt aangewezen dit woord zeggen, als dit je lukt, roep je \"Gotchaaa\" en krijgt ge uw punten" : ""}
                key={gotchaDesc ? "gotcha" : "other"}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-gray-500"
                placeholder="Describe what the player needs to do..."
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  required
                  defaultValue="medium"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                >
                  <option value="easy">Easy (5pts)</option>
                  <option value="medium">Medium (10pts)</option>
                  <option value="hard">Hard (20pts)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Points
                </label>
                <input
                  name="points"
                  type="number"
                  defaultValue={10}
                  min={1}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                />
              </div>
            </div>
            <input type="hidden" name="requires_target" value={requiresTarget ? "true" : ""} />
            <button
              type="button"
              onClick={() => setRequiresTarget(!requiresTarget)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                requiresTarget
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-slate-600 bg-slate-700/50 text-gray-400"
              }`}
            >
              <span className="text-lg">{requiresTarget ? "✅" : "⬜"}</span>
              <span>Moet uitgevoerd worden op nen andere</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-2.5 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Challenge"}
            </button>
          </form>
        )}

        {/* Challenge List */}
        {tab === "list" && (
          <div className="space-y-2">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-3 backdrop-blur"
              >
                <div>
                  <span className="text-xs font-medium text-amber-400">
                    {c.categories?.name}
                  </span>
                  <p className="font-semibold text-white">
                    {c.title}
                    {c.requires_target && <span className="ml-1 text-xs text-orange-400">🎯</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.difficulty} · {c.points}pts
                    {c.requires_target && " · op iemand anders"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            ))}
            {challenges.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 text-center text-gray-400">
                No challenges yet. Add some!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
