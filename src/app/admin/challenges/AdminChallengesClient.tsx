"use client";

import { useState } from "react";
import { User, Category } from "@/lib/types";
import { addChallenge, updateChallenge, deleteChallenge } from "../../actions";
import Link from "next/link";

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

type AssignmentInfo = { status: string; playerName: string };

export default function AdminChallengesClient({
  user,
  categories,
  challenges: initialChallenges,
  adminNames,
  assignedMap,
}: {
  user: User;
  categories: Category[];
  challenges: ChallengeWithCat[];
  adminNames: string[];
  assignedMap: Record<string, AssignmentInfo[]>;
}) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [tab, setTab] = useState<"add" | "list">("list");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [requiresTarget, setRequiresTarget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gotchaDesc, setGotchaDesc] = useState(false);
  const [points, setPoints] = useState(10);
  const [bonusActive, setBonusActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBonusActive, setEditBonusActive] = useState(false);
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
      setBonusActive(false);
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
      const updated = {
        id: challengeId,
        title: form.get("title") as string,
        description: form.get("description") as string || "",
        difficulty: form.get("difficulty") as string,
        points: parseInt(form.get("points") as string) || 10,
        requires_target: form.get("requires_target") === "true",
        created_by_admin: form.get("created_by_admin") as string || null,
        bonus_description: form.get("bonus_description") as string || null,
        bonus_points: parseInt(form.get("bonus_points") as string) || 0,
        categories: { name: categories.find((cat) => cat.id === form.get("category_id"))?.name || "" },
      };
      setChallenges((prev) => prev.map((c) => c.id === challengeId ? updated : c));
    }
    setEditLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this challenge?")) return;
    await deleteChallenge(id);
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }

  const categoryNames = Array.from(new Set(challenges.map((c) => c.categories?.name).filter(Boolean))) as string[];
  const filteredChallenges = categoryFilter === "all"
    ? challenges
    : challenges.filter((c) => c.categories?.name === categoryFilter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/admin"
            className="rounded-lg bg-slate-700/50 px-3 py-2 text-sm text-gray-400 transition hover:bg-slate-700 hover:text-white"
          >
            ← Terug
          </Link>
          <h1 className="text-lg font-black text-white">📝 Challenges</h1>
          <span className="rounded-full bg-slate-700/50 px-2.5 py-1 text-xs font-bold text-amber-400">
            {challenges.length}
          </span>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex rounded-xl border border-slate-700 bg-slate-800/60 p-0.5">
          <button
            onClick={() => setTab("list")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
              tab === "list" ? "bg-slate-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📋 Lijst ({challenges.length})
          </button>
          <button
            onClick={() => setTab("add")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
              tab === "add" ? "bg-amber-500 text-black" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ➕ Toevoegen
          </button>
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
            className="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-5"
          >
            <input type="hidden" name="created_by_admin" value={currentAdminName} />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Category</label>
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
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
              >
                <option value="">Kies categorie...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Titel</label>
              <input
                name="title"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                placeholder="e.g. Secret Word Master"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Beschrijving</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={gotchaDesc ? "Laat de persoon die wordt aangewezen dit woord zeggen, als dit je lukt, roep je \"Gotchaaa\" en krijgt ge uw punten" : ""}
                key={gotchaDesc ? "gotcha" : "other"}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                placeholder="Wat moet de speler doen..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Difficulty</label>
              <select
                name="difficulty"
                required
                defaultValue="medium"
                onChange={(e) => setPoints(DIFFICULTY_POINTS[e.target.value] ?? 10)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
              >
                <option value="easy">Easy (5pts)</option>
                <option value="medium">Medium (10pts)</option>
                <option value="hard">Hard (20pts)</option>
              </select>
              <input type="hidden" name="points" value={points} />
            </div>
            <button
              type="button"
              onClick={() => setBonusActive(!bonusActive)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                bonusActive
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-slate-600 bg-slate-700/50 text-gray-400"
              }`}
            >
              <span>{bonusActive ? "✅" : "⬜"}</span>
              <span>🌟 Bonus toevoegen</span>
            </button>
            {bonusActive && (
              <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 space-y-3">
                <textarea
                  name="bonus_description"
                  rows={2}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  placeholder="Bonus beschrijving..."
                />
                <input
                  name="bonus_points"
                  type="number"
                  defaultValue={5}
                  min={0}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
            )}
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
              <span>{requiresTarget ? "✅" : "⬜"}</span>
              <span>Moet uitgevoerd worden op nen andere</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-2.5 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Challenge toevoegen"}
            </button>
          </form>
        )}

        {/* Challenge List */}
        {tab === "list" && (
          <div className="space-y-3">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
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
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                      categoryFilter === name
                        ? "bg-amber-500 text-black"
                        : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                    }`}
                  >
                    {name} ({count})
                  </button>
                );
              })}
            </div>

            {filteredChallenges.map((c) => {
              const assignmentInfo = assignedMap[c.id];
              const isAssigned = !!assignmentInfo && assignmentInfo.length > 0;
              const isLocked = isAssigned;

              return editingId === c.id && !isLocked ? (
                <form
                  key={c.id}
                  onSubmit={(e) => handleEdit(e, c.id)}
                  className="space-y-3 rounded-2xl border border-amber-500/30 bg-slate-800/90 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-amber-400">✏️ Editing</p>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-white">✕</button>
                  </div>
                  <select name="category_id" defaultValue={categories.find((cat) => cat.name === c.categories?.name)?.id || ""} required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input name="title" defaultValue={c.title} required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
                  <textarea name="description" defaultValue={c.description} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
                  <select name="difficulty" defaultValue={c.difficulty} required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" onChange={(e) => {
                    const pts = DIFFICULTY_POINTS[e.target.value] ?? 10;
                    const hidden = e.target.parentElement?.querySelector('input[name="points"]') as HTMLInputElement | null;
                    if (hidden) hidden.value = String(pts);
                  }}>
                    <option value="easy">Easy (5pts)</option>
                    <option value="medium">Medium (10pts)</option>
                    <option value="hard">Hard (20pts)</option>
                  </select>
                  <input type="hidden" name="points" defaultValue={c.points} />
                  <button
                    type="button"
                    onClick={() => setEditBonusActive(!editBonusActive)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                      editBonusActive ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-slate-600 bg-slate-700/50 text-gray-400"
                    }`}
                  >
                    <span>{editBonusActive ? "✅" : "⬜"}</span>
                    <span>🌟 Bonus</span>
                  </button>
                  {editBonusActive && (
                    <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 space-y-2">
                      <textarea name="bonus_description" defaultValue={c.bonus_description || ""} rows={2} placeholder="Bonus beschrijving..." className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-white placeholder:text-gray-500" />
                      <input name="bonus_points" type="number" defaultValue={c.bonus_points || 5} min={0} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-white" />
                    </div>
                  )}
                  <input type="hidden" name="requires_target" value={c.requires_target ? "true" : ""} />
                  <select name="created_by_admin" defaultValue={c.created_by_admin || ""} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
                    <option value="">Onbekend</option>
                    {adminNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={editLoading} className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50">
                    {editLoading ? "Saving..." : "💾 Opslaan"}
                  </button>
                </form>
              ) : (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-3 ${
                    isLocked
                      ? "border-slate-700/20 bg-slate-900/40 opacity-60"
                      : "border-slate-700/40 bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-amber-400">{c.categories?.name}</span>
                        {c.bonus_points > 0 && <span className="text-[10px] text-yellow-400">🌟+{c.bonus_points}</span>}
                        {c.requires_target && <span className="text-[10px] text-orange-400">🎯</span>}
                        {isLocked && (
                          <span className="text-[10px] font-bold text-gray-500">🔒 Toegewezen</span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${isLocked ? "text-gray-400" : "text-white"}`}>{c.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {c.difficulty} · {c.points}pts · {c.created_by_admin || "?"}
                      </p>
                      {isAssigned && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {assignmentInfo.map((a, i) => (
                            <span key={i} className={`text-[9px] rounded px-1.5 py-0.5 ${
                              a.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                              a.status === "expired" ? "bg-gray-500/10 text-gray-500" :
                              "bg-blue-500/10 text-blue-400"
                            }`}>
                              {a.playerName} · {a.status}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isLocked && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => { setEditingId(c.id); setEditBonusActive(!!(c.bonus_description || c.bonus_points > 0)); }}
                          className="rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-gray-400 transition hover:bg-slate-600 hover:text-white"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredChallenges.length === 0 && (
              <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-8 text-center text-gray-400">
                Geen challenges in deze categorie.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
