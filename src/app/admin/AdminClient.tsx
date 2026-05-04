"use client";

import { useState } from "react";
import { User, Category } from "@/lib/types";
import { addChallenge, updateChallenge, deleteChallenge, logout } from "../actions";

type ChallengeWithCat = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  requires_target: boolean;
  created_by_admin: string | null;
  bonus_description: string | null;
  bonus_points: number;
  categories: { name: string } | null;
};

const DIFFICULTY_POINTS: Record<string, number> = { easy: 5, medium: 10, hard: 20 };

export default function AdminClient({
  user,
  categories,
  challenges: initialChallenges,
  adminNames,
}: {
  user: User;
  categories: Category[];
  challenges: ChallengeWithCat[];
  adminNames: string[];
}) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [tab, setTab] = useState<"add" | "list">("add");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [requiresTarget, setRequiresTarget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gotchaDesc, setGotchaDesc] = useState(false);
  const [points, setPoints] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const currentAdminName = user.name.replace(" (Admin)", "");

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
      setPoints(10);
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>, challengeId: string) {
    e.preventDefault();
    setEditLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await updateChallenge(challengeId, form);
    if ("error" in res) {
      alert(res.error);
    } else {
      setEditingId(null);
      window.location.reload();
    }
    setEditLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this challenge?")) return;
    await deleteChallenge(id);
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }

  // Get unique category names for subtabs
  const categoryNames = Array.from(new Set(challenges.map((c) => c.categories?.name).filter(Boolean))) as string[];

  // Filter challenges by category
  const filteredChallenges = categoryFilter === "all"
    ? challenges
    : challenges.filter((c) => c.categories?.name === categoryFilter);

  const tabs = [
    { key: "add" as const, label: "➕ Add Challenge" },
    { key: "list" as const, label: `📋 All Challenges (${challenges.length})` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="shrink-0 text-2xl font-extrabold text-white">
            ⚙️ Admin
          </h1>
          <form action={logout}>
            <button className="rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-gray-400 transition hover:bg-slate-700" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
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
            <input type="hidden" name="created_by_admin" value={currentAdminName} />
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
                  onChange={(e) => setPoints(DIFFICULTY_POINTS[e.target.value] ?? 10)}
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
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  min={1}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                />
              </div>
            </div>
            {/* Bonus fields */}
            <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-400/80">🌟 Bonus (optioneel)</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Bonus beschrijving
                </label>
                <textarea
                  name="bonus_description"
                  rows={2}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  placeholder="Wat moet de speler extra doen voor bonuspunten?"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Bonus punten
                </label>
                <input
                  name="bonus_points"
                  type="number"
                  defaultValue={0}
                  min={0}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
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
          <div className="space-y-3">
            {/* Category subtabs */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  categoryFilter === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                }`}
              >
                Alles ({challenges.length})
              </button>
              {categoryNames.map((name) => {
                const count = challenges.filter((c) => c.categories?.name === name).length;
                return (
                  <button
                    key={name}
                    onClick={() => setCategoryFilter(name)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      categoryFilter === name
                        ? "bg-amber-500 text-black"
                        : "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                    }`}
                  >
                    {name} ({count})
                  </button>
                );
              })}
            </div>

            {filteredChallenges.map((c) =>
              editingId === c.id ? (
                /* Inline edit form */
                <form
                  key={c.id}
                  onSubmit={(e) => handleEdit(e, c.id)}
                  className="space-y-3 rounded-xl border border-amber-500/30 bg-slate-800/90 p-4 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-amber-400">✏️ Editing</p>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-white">✕ Cancel</button>
                  </div>
                  <select name="category_id" defaultValue={categories.find((cat) => cat.name === c.categories?.name)?.id || ""} required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input name="title" defaultValue={c.title} required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
                  <textarea name="description" defaultValue={c.description} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
                  <div className="flex gap-3">
                    <select name="difficulty" defaultValue={c.difficulty} required className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
                      <option value="easy">Easy (5pts)</option>
                      <option value="medium">Medium (10pts)</option>
                      <option value="hard">Hard (20pts)</option>
                    </select>
                    <input name="points" type="number" defaultValue={c.points} min={1} required className="w-20 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
                  </div>
                  <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 space-y-2">
                    <p className="text-xs font-bold text-amber-400/80">🌟 Bonus</p>
                    <textarea name="bonus_description" defaultValue={c.bonus_description || ""} rows={2} placeholder="Bonus beschrijving..." className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-white placeholder:text-gray-500" />
                    <input name="bonus_points" type="number" defaultValue={c.bonus_points || 0} min={0} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-white" />
                  </div>
                  <input type="hidden" name="requires_target" value={c.requires_target ? "true" : ""} />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Door (admin)</label>
                    <select name="created_by_admin" defaultValue={c.created_by_admin || ""} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
                      <option value="">Onbekend</option>
                      {adminNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={editLoading} className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50">
                    {editLoading ? "Saving..." : "💾 Save"}
                  </button>
                </form>
              ) : (
                /* Challenge card */
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-400">
                          {c.categories?.name}
                        </span>
                        {c.bonus_points > 0 && (
                          <span className="text-xs text-yellow-400">🌟 +{c.bonus_points}bonus</span>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {c.title}
                        {c.requires_target && <span className="ml-1 text-xs text-orange-400">🎯</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.difficulty} · {c.points}pts
                        {c.requires_target && " · op iemand anders"}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        Door: {c.created_by_admin || "Onbekend"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => setEditingId(c.id)}
                        className="rounded-lg bg-slate-600/40 px-2.5 py-1 text-sm text-gray-300 transition hover:bg-slate-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg bg-red-500/20 px-2.5 py-1 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
            {filteredChallenges.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 text-center text-gray-400">
                {categoryFilter === "all" ? "No challenges yet. Add some!" : `Geen challenges in "${categoryFilter}"`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
