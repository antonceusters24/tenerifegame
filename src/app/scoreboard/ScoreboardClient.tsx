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
  avatarMap,
}: {
  user: User;
  entries: ScoreboardEntry[];
  allAssignments: AssignmentDetail[];
  cfScores: CFScore[];
  emojiMap: Record<string, string>;
  avatarMap: Record<string, string | null>;
}) {
  const [tab, setTab] = useState<"challenge" | "chinese">("challenge");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cfScores, setCfScores] = useState(initialCF);
  const [cfLoading, setCfLoading] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [viewingProfile, setViewingProfile] = useState<{ name: string; url: string } | null>(null);

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
    if (!val) return;
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
        <div className="mb-4 flex rounded-2xl bg-slate-800/80 p-1 shadow-inner">
          <button
            onClick={() => setTab("challenge")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-extrabold tracking-wide transition-all duration-200 ${
              tab === "challenge"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🎯 Challenge
          </button>
          <button
            onClick={() => setTab("chinese")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-extrabold tracking-wide transition-all duration-200 whitespace-nowrap ${
              tab === "chinese"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 scale-[1.02]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            👲 Chinese Fucking
          </button>
        </div>

        {/* Challenge Scoreboard */}
        {tab === "challenge" && (
          <div className="space-y-2.5">
            {entries.map((entry, i) => {
              const isExpanded = expanded === entry.user_id;
              const playerAssignments = getPlayerAssignments(entry.user_id);
              const isOwnProfile = entry.user_id === user.id;
              const activeOnes = isOwnProfile
                ? playerAssignments.filter((a) => a.status === "active" || a.status === "pending")
                : [];
              const completedOnes = playerAssignments.filter((a) => a.status === "completed");
              const skippedOnes = playerAssignments.filter((a) => a.status === "skipped");

              const RANK_META = [
                { medal: "🥇", title: "Legend",        titleColor: "text-amber-400",  card: "border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-slate-800/60 to-transparent", glow: "shadow-amber-500/15" },
                { medal: "🥈", title: "Leeuw",         titleColor: "text-slate-300",   card: "border-slate-500/40 bg-gradient-to-r from-slate-500/10 via-slate-800/60 to-transparent", glow: "" },
                { medal: "🥉", title: "Matig ze",      titleColor: "text-orange-400",  card: "border-orange-700/30 bg-gradient-to-r from-orange-700/8 via-slate-800/60 to-transparent", glow: "" },
                { medal: "💀", title: "Wa ne sukkeleir", titleColor: "text-red-400",   card: "border-red-900/40 bg-gradient-to-r from-red-900/10 via-slate-800/60 to-transparent",    glow: "" },
              ];
              const rm = RANK_META[Math.min(i, 3)];

              return (
                <div key={entry.user_id}>
                  <div
                    onClick={() => toggle(entry.user_id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-lg transition active:scale-[0.98] ${rm.card} ${rm.glow ? `shadow-lg ${rm.glow}` : ""} ${isExpanded ? "rounded-b-none" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank column */}
                      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                        <span className="text-2xl leading-none">{rm.medal}</span>
                        <span className={`text-[9px] font-bold leading-none ${rm.titleColor}`}>{rm.title}</span>
                      </div>

                      {/* Avatar */}
                      {avatarMap[entry.name] ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingProfile({ name: entry.name, url: avatarMap[entry.name]! }); }}
                          className="shrink-0"
                        >
                          <img src={avatarMap[entry.name]!} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-500/40 transition active:scale-110" />
                        </button>
                      ) : (
                        <span className="shrink-0 text-3xl leading-none">{emojiMap[entry.name] || "🎮"}</span>
                      )}

                      {/* Name + stats */}
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-white">
                          {entry.name}
                          {entry.name === user.name && <span className="text-xs font-normal text-gray-500">(gij)</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.completed_count} gedaan · {entry.skipped_count} geskipt
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex shrink-0 items-center gap-2">
                        <p className={`text-3xl font-black tabular-nums ${entry.total_points < 0 ? "text-red-400" : "text-amber-400"}`}>
                          {entry.total_points}
                        </p>
                        <span className="text-[10px] text-gray-600">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="rounded-b-2xl border border-t-0 border-slate-700/60 bg-slate-800/50 p-3 space-y-2">
                      {activeOnes.length > 0 && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">Actieve challenge</p>
                          {activeOnes.map((a) => (
                            <div key={a.id} className="rounded-lg bg-amber-500/8 px-3 py-1.5 text-sm text-gray-300">
                              🎯 {a.challenges?.title || "Unknown"}
                            </div>
                          ))}
                        </div>
                      )}
                      {completedOnes.length > 0 && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Gedaan ✅</p>
                          <div className="space-y-1">
                            {completedOnes.map((a) => (
                              <div key={a.id} className="flex items-center justify-between rounded-lg bg-emerald-500/8 px-3 py-1.5 text-sm">
                                <span className="truncate text-gray-300">{a.challenges?.title || "Unknown"} <span className="text-xs text-gray-600">Dag {a.day}</span></span>
                                <span className="ml-2 shrink-0 text-xs font-bold text-emerald-400">+{a.challenges?.points}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {skippedOnes.length > 0 && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-400">Geskipt ❌</p>
                          <div className="space-y-1">
                            {skippedOnes.map((a) => (
                              <div key={a.id} className="flex items-center justify-between rounded-lg bg-red-500/8 px-3 py-1.5 text-sm">
                                <span className="truncate text-gray-500 line-through">{a.challenges?.title || "Unknown"}</span>
                                <span className="ml-2 shrink-0 text-xs font-bold text-red-400">-10</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {playerAssignments.length === 0 && (
                        <p className="py-2 text-center text-sm text-gray-500">Nog niks gedaan, tammen hol</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 text-center text-gray-400">
                Nog geen scores — begin te spelen mannen!
              </div>
            )}
          </div>
        )}

        {/* Chinese Fucking Scoreboard */}
        {tab === "chinese" && (
          <div>
            <p className="mb-3 text-center text-xs text-gray-500">
              {isAnton ? "Voeg punten toe per sessie" : "Alleen onzen Anton past scores aan"}
            </p>

            <div className="space-y-2.5">
              {[...cfScores]
                .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0))
                .map((player, i) => {
                  const pts = player.points || 0;
                  const wins = player.wins || 0;
                  const CF_META = [
                    { medal: "🥇", title: "Koning Fucker",   titleColor: "text-red-400",    card: "border-red-500/40 bg-gradient-to-r from-red-500/15 via-slate-800/60 to-transparent" },
                    { medal: "🥈", title: "Goeie Poeper", titleColor: "text-slate-300",   card: "border-slate-500/30 bg-gradient-to-r from-slate-500/8 via-slate-800/60 to-transparent" },
                    { medal: "🥉", title: "Chinees Poepslaafje",titleColor: "text-orange-400",  card: "border-orange-700/30 bg-gradient-to-r from-orange-700/8 via-slate-800/60 to-transparent" },
                    { medal: "💀", title: "ik word Chinees GEpoept",        titleColor: "text-gray-500",   card: "border-red-900/30 bg-gradient-to-r from-red-900/8 via-slate-800/60 to-transparent" },
                  ];
                  const cm = CF_META[Math.min(i, 3)];

                  return (
                    <div key={player.player_name} className={`rounded-2xl border p-4 shadow-lg ${cm.card}`}>
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                          <span className="text-2xl leading-none">{cm.medal}</span>
                          <span className={`text-[9px] font-bold leading-none ${cm.titleColor}`}>{cm.title}</span>
                        </div>

                        {/* Avatar */}
                        {avatarMap[player.player_name] ? (
                          <button
                            onClick={() => setViewingProfile({ name: player.player_name, url: avatarMap[player.player_name]! })}
                            className="shrink-0"
                          >
                            <img src={avatarMap[player.player_name]!} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-red-500/40 transition active:scale-110" />
                          </button>
                        ) : (
                          <span className="shrink-0 text-3xl leading-none">{emojiMap[player.player_name] || "🎮"}</span>
                        )}

                        {/* Name + wins */}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-white">
                            {player.player_name}
                            {player.player_name === user.name && <span className="text-xs font-normal text-gray-500">(gij)</span>}
                          </p>
                          <p className="text-xs text-amber-400/80">🏆 {wins} {wins === 1 ? "win" : "wins"}</p>
                        </div>

                        {/* Points */}
                        <p className={`shrink-0 text-3xl font-black tabular-nums ${pts > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                          {pts}
                        </p>
                      </div>

                      {/* Anton controls */}
                      {isAnton && (
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-700/40 pt-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleCF(player.player_name, "wins", 1)} disabled={cfLoading !== null} className="rounded-lg bg-amber-600/80 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-500 active:scale-90 disabled:opacity-50">🏆+</button>
                            <button onClick={() => handleCF(player.player_name, "wins", -1)} disabled={cfLoading !== null} className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-slate-600 active:scale-90 disabled:opacity-50">🏆-</button>
                          </div>
                          <div className="flex flex-1 gap-1">
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="+/- punten"
                              value={pointsInput[player.player_name] || ""}
                              onChange={(e) => setPointsInput((prev) => ({ ...prev, [player.player_name]: e.target.value }))}
                              className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-700/50 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                            />
                            <button onClick={() => handleAddPoints(player.player_name)} disabled={cfLoading !== null || !pointsInput[player.player_name]} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-90 disabled:opacity-50">✓</button>
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

      {/* Profile picture viewer modal */}
      {viewingProfile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setViewingProfile(null)}
        >
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingProfile.url}
              alt={viewingProfile.name}
              className="w-64 h-64 rounded-full object-cover ring-4 ring-amber-500/50 shadow-2xl"
            />
            <p className="text-lg font-bold text-white">{viewingProfile.name}</p>
            <button
              onClick={() => setViewingProfile(null)}
              className="mt-2 rounded-lg bg-slate-700 px-6 py-2 text-sm font-medium text-gray-300 transition hover:bg-slate-600"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
