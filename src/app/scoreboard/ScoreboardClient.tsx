"use client";

import { useState } from "react";
import { User, ScoreboardEntry } from "@/lib/types";
import { updateChineseFuckingScore } from "../actions";
import Link from "next/link";

type AssignmentDetail = {
  id: string;
  user_id: string;
  day: number;
  status: string;
  challenges: {
    title: string;
    points: number;
    difficulty: string;
    categories: { name: string } | null;
  } | null;
  users: { name: string } | null;
};

type CFScore = {
  player_name: string;
  wins: number;
  points: number;
};

export default function ScoreboardClient({
  user,
  entries,
  allAssignments,
  cfScores: initialCF,
  emojiMap,
}: {
  user: User;
  entries: ScoreboardEntry[];
  allAssignments: AssignmentDetail[];
  cfScores: CFScore[];
  emojiMap: Record<string, string>;
}) {
  const [tab, setTab] = useState<"challenge" | "chinese">("challenge");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cfScores, setCfScores] = useState(initialCF);
  const [cfLoading, setCfLoading] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});

  const isAnton = user.name === "Anton";

  function toggle(userId: string) {
    setExpanded((prev) => (prev === userId ? null : userId));
  }

  function getPlayerAssignments(userId: string) {
    return allAssignments.filter((a) => a.user_id === userId);
  }

  async function handleCF(playerName: string, field: "wins" | "points", delta: number) {
    setCfLoading(`${playerName}-${field}-${delta}`);
    await updateChineseFuckingScore(playerName, field, delta);
    setCfScores((prev) =>
      prev.map((s) =>
        s.player_name === playerName
          ? { ...s, [field]: Math.max(0, (s[field] || 0) + delta) }
          : s
      )
    );
    setCfLoading(null);
  }

  async function handleAddPoints(playerName: string) {
    const val = parseInt(pointsInput[playerName] || "0");
    if (!val || val <= 0) return;
    await handleCF(playerName, "points", val);
    setPointsInput((prev) => ({ ...prev, [playerName]: "" }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">🏆 Scores</h1>
          <Link
            href={user.role === "admin" ? "/admin" : "/dashboard"}
            className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm font-medium text-gray-400 transition hover:bg-slate-700"
          >
            ← Terug
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("challenge")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "challenge"
                ? "bg-amber-500 text-black shadow-lg"
                : "bg-slate-800/60 text-gray-400 hover:bg-slate-700"
            }`}
          >
            🎯 Challenge
          </button>
          <button
            onClick={() => setTab("chinese")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "chinese"
                ? "bg-red-500 text-white shadow-lg"
                : "bg-slate-800/60 text-gray-400 hover:bg-slate-700"
            }`}
          >
            👲 Chinese Fucking
          </button>
        </div>

        {/* Challenge Scoreboard */}
        {tab === "challenge" && (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isExpanded = expanded === entry.user_id;
              const playerAssignments = getPlayerAssignments(entry.user_id);
              const isOwnProfile = entry.user_id === user.id;
              const activeOnes = isOwnProfile
                ? playerAssignments.filter(
                    (a) => a.status === "active" || a.status === "pending"
                  )
                : [];
              const completedOnes = playerAssignments.filter(
                (a) => a.status === "completed"
              );
              const skippedOnes = playerAssignments.filter(
                (a) => a.status === "skipped"
              );

              const medals = ["🥇", "🥈", "🥉"];
              const rankColors = [
                "from-amber-500/20 to-transparent border-amber-500/40",
                "from-slate-400/10 to-transparent border-slate-400/30",
                "from-orange-700/10 to-transparent border-orange-700/30",
                "from-slate-800/40 to-transparent border-slate-700",
              ];

              return (
                <div key={entry.user_id}>
                  <button
                    onClick={() => toggle(entry.user_id)}
                    className={`w-full rounded-xl border bg-gradient-to-r p-4 text-left transition active:scale-[0.98] ${
                      rankColors[Math.min(i, 3)]
                    } ${isExpanded ? "ring-1 ring-amber-500/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="min-w-[2rem] text-center text-2xl">
                          {medals[i] || `#${i + 1}`}
                        </span>
                        <div>
                          <p className="text-lg font-extrabold text-white">
                            {emojiMap[entry.name] || "🎮"} {entry.name}
                            {entry.name === user.name && (
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                (gij)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.completed_count} gedaan · {entry.skipped_count} geskipt
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-3xl font-black ${entry.total_points < 0 ? "text-red-400" : "text-amber-400"}`}>
                          {entry.total_points}
                        </p>
                        <span className="text-xs text-gray-600">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-1 rounded-b-xl border border-t-0 border-slate-700 bg-slate-800/40 p-3">
                      {activeOnes.length > 0 && (
                        <div className="mb-2">
                          <p className="mb-1 text-xs font-bold uppercase text-amber-400">
                            Uw actieve challenge
                          </p>
                          {activeOnes.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-lg bg-slate-700/30 px-3 py-1.5 text-sm text-gray-300"
                            >
                              🎯 {a.challenges?.title || "Unknown"}
                            </div>
                          ))}
                        </div>
                      )}

                      {completedOnes.length > 0 && (
                        <div className="mb-2">
                          <p className="mb-1 text-xs font-bold uppercase text-emerald-400">
                            Gedaan ✅
                          </p>
                          {completedOnes.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-1.5 text-sm"
                            >
                              <span className="text-gray-300">
                                {a.challenges?.title || "Unknown"}
                                <span className="ml-2 text-xs text-gray-600">
                                  Dag {a.day}
                                </span>
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                +{a.challenges?.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {skippedOnes.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase text-red-400">
                            Geskipt ❌
                          </p>
                          {skippedOnes.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-1.5 text-sm"
                            >
                              <span className="text-gray-500 line-through">
                                {a.challenges?.title || "Unknown"}
                              </span>
                              <span className="text-xs font-bold text-red-400">
                                -10
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {playerAssignments.length === 0 && (
                        <p className="py-2 text-center text-sm text-gray-500">
                          Nog niks gedaan, luiaard
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-8 text-center text-gray-400">
                Nog geen scores — begin te spelen mannen!
              </div>
            )}
          </div>
        )}

        {/* Chinese Fucking Scoreboard */}
        {tab === "chinese" && (
          <div>
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <p className="text-lg font-extrabold text-red-400">
                👲 Chinese Fucking 👲
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {isAnton ? "Voeg punten toe per sessie" : "Alleen onzen Anton past scores aan"}
              </p>
            </div>

            <div className="space-y-2">
              {[...cfScores]
                .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0))
                .map((player, i) => {
                  const pts = player.points || 0;
                  const wins = player.wins || 0;
                  return (
                    <div
                      key={player.player_name}
                      className={`rounded-xl border p-4 transition ${
                        i === 0
                          ? "border-red-500/40 bg-gradient-to-r from-red-500/10 to-transparent"
                          : "border-slate-700 bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-lg font-extrabold text-white">
                              {emojiMap[player.player_name] || "🎮"} {player.player_name}
                              {player.player_name === user.name && (
                                <span className="ml-2 text-xs font-normal text-gray-500">(gij)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="text-amber-400">🏆 {wins} wins</span>
                            </p>
                          </div>
                        </div>

                        <p className={`min-w-[3rem] text-right text-3xl font-black ${pts > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                          {pts}
                        </p>
                      </div>

                      {/* Anton controls */}
                      {isAnton && (
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-700/50 pt-3">
                          {/* Win buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCF(player.player_name, "wins", 1)}
                              disabled={cfLoading !== null}
                              className="rounded bg-amber-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-amber-500 active:scale-90 disabled:opacity-50"
                            >
                              🏆+
                            </button>
                            <button
                              onClick={() => handleCF(player.player_name, "wins", -1)}
                              disabled={cfLoading !== null}
                              className="rounded bg-slate-700 px-2 py-1 text-xs text-gray-400 transition hover:bg-slate-600 active:scale-90 disabled:opacity-50"
                            >
                              🏆-
                            </button>
                          </div>

                          {/* Points input */}
                          <div className="flex flex-1 gap-1">
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="Punten..."
                              value={pointsInput[player.player_name] || ""}
                              onChange={(e) =>
                                setPointsInput((prev) => ({
                                  ...prev,
                                  [player.player_name]: e.target.value,
                                }))
                              }
                              className="w-full min-w-0 rounded border border-slate-600 bg-slate-700/50 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                            />
                            <button
                              onClick={() => handleAddPoints(player.player_name)}
                              disabled={cfLoading !== null || !pointsInput[player.player_name]}
                              className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-90 disabled:opacity-50"
                            >
                              + Punten
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
