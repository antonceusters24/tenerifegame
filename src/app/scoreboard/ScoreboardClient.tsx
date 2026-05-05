"use client";

import { useState } from "react";
import { User, ScoreboardEntry } from "@/lib/types";
import { addCFSession, deleteCFSession } from "../actions";
import { getCurrentDay } from "@/lib/game";
import Link from "next/link";

type AssignmentDetail = {
  id: string;
  user_id: string;
  day: number;
  status: string;
  bonus_completed: boolean;
  challenges: {
    title: string;
    points: number;
    bonus_points: number;
    difficulty: string;
    categories: { name: string } | null;
  } | null;
  users: { name: string } | null;
};

type CFSession = {
  id: string;
  created_at: string;
  day: number;
  scores: Record<string, number>;
};

export default function ScoreboardClient({
  user,
  entries,
  allAssignments,
  cfSessions: initialSessions,
  emojiMap,
  avatarMap,
}: {
  user: User;
  entries: ScoreboardEntry[];
  allAssignments: AssignmentDetail[];
  cfSessions: CFSession[];
  emojiMap: Record<string, string>;
  avatarMap: Record<string, string | null>;
}) {
  const [tab, setTab] = useState<"challenge" | "chinese">("challenge");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cfSessions, setCfSessions] = useState(initialSessions);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<string, string>>({});
  const [sessionDay, setSessionDay] = useState<number>(getCurrentDay() || 1);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfSubTab, setCfSubTab] = useState<"ranking" | "stats" | "sessies">("ranking");
  const [challengeSubTab, setChallengeSubTab] = useState<"ranking" | "stats">("ranking");
  const [viewingProfile, setViewingProfile] = useState<{ name: string; url: string } | null>(null);

  const isAnton = user.name === "Anton";
  const CF_PLAYERS = ["Lander", "Berten", "Dries", "Anton"];

  // Compute stats from sessions
  function getCFStats() {
    const stats: Record<string, { points: number; wins: number; sessions: number }> = {};
    CF_PLAYERS.forEach((p) => { stats[p] = { points: 0, wins: 0, sessions: 0 }; });

    cfSessions.forEach((session) => {
      const scores = session.scores || {};
      let maxPoints = -1;
      let winner = "";
      CF_PLAYERS.forEach((p) => {
        const pts = scores[p] || 0;
        if (pts > 0) stats[p].sessions++;
        stats[p].points += pts;
        if (pts > maxPoints) { maxPoints = pts; winner = p; }
      });
      // Check for ties — no winner if tied
      const winnersCount = CF_PLAYERS.filter((p) => (scores[p] || 0) === maxPoints).length;
      if (winner && maxPoints > 0 && winnersCount === 1) {
        stats[winner].wins++;
      }
    });
    return stats;
  }

  function toggle(userId: string) {
    setExpanded((prev) => (prev === userId ? null : userId));
  }

  function getPlayerAssignments(userId: string) {
    return allAssignments.filter((a) => a.user_id === userId);
  }

  async function handleAddSession() {
    setCfLoading(true);
    const scores: Record<string, number> = {};
    CF_PLAYERS.forEach((p) => {
      const val = parseInt(sessionScores[p] || "0");
      if (val > 0) scores[p] = val;
    });
    if (Object.values(scores).every((v) => v === 0)) {
      setCfLoading(false);
      return;
    }
    const res = await addCFSession(scores, sessionDay);
    if ("success" in res && res.session) {
      setCfSessions((prev) => [...prev, res.session]);
      setSessionScores({});
      setSessionDay(getCurrentDay() || 1);
      setShowAddSession(false);
    }
    setCfLoading(false);
  }

  async function handleDeleteSession(id: string) {
    setCfLoading(true);
    const res = await deleteCFSession(id);
    if ("success" in res) {
      setCfSessions((prev) => prev.filter((s) => s.id !== id));
    }
    setCfLoading(false);
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
          <div>
            {/* Sub-tabs — minimal underline style */}
            <div className="mb-5 flex border-b border-slate-700/50">
              {([["ranking", "Ranking"], ["stats", "Stats"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setChallengeSubTab(key)}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all ${
                    challengeSubTab === key
                      ? "text-amber-400 border-b-2 border-amber-500"
                      : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Ranking sub-tab */}
            {challengeSubTab === "ranking" && (
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
                  const expiredOnes = playerAssignments.filter((a) => a.status === "expired");

                  const RANK_META = [
                    { medal: "🥇", title: "Legend",        titleColor: "text-amber-400",  card: "border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-slate-800/60 to-transparent", glow: "shadow-amber-500/15" },
                    { medal: "🥈", title: "Leeuw",         titleColor: "text-slate-300",   card: "border-slate-500/40 bg-gradient-to-r from-slate-500/10 via-slate-800/60 to-transparent", glow: "" },
                    { medal: "🥉", title: "Plebs",      titleColor: "text-orange-400",  card: "border-orange-700/30 bg-gradient-to-r from-orange-700/8 via-slate-800/60 to-transparent", glow: "" },
                    { medal: "💀", title: "Sukkeleir", titleColor: "text-red-400",   card: "border-red-900/40 bg-gradient-to-r from-red-900/10 via-slate-800/60 to-transparent",    glow: "" },
                  ];
                  const rm = RANK_META[Math.min(i, 3)];

                  return (
                    <div key={entry.user_id}>
                      <div
                        onClick={() => toggle(entry.user_id)}
                        className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-lg transition active:scale-[0.98] ${rm.card} ${rm.glow ? `shadow-lg ${rm.glow}` : ""} ${isExpanded ? "rounded-b-none" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                            <span className="text-2xl leading-none">{rm.medal}</span>
                            <span className={`text-[9px] font-bold leading-none ${rm.titleColor}`}>{rm.title}</span>
                          </div>
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
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-white">
                              {entry.name}
                              {entry.name === user.name && <span className="text-xs font-normal text-gray-500">(gij)</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.completed_count} gedaan · {entry.skipped_count} geskipt{entry.expired_count > 0 && ` · ${entry.expired_count} te laaaaat`}
                            </p>
                          </div>
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
                          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                            {entry.earned_points > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">+{entry.earned_points} challenges</span>}
                            {entry.bonus_earned > 0 && <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-yellow-400">+{entry.bonus_earned} bonus</span>}
                            {entry.penalty_points < 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-400">{entry.penalty_points} penalty</span>}
                          </div>
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
                            <details open>
                              <summary className="mb-1 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-emerald-400">Gedaan ({completedOnes.length})</summary>
                              <div className="space-y-1">
                                {completedOnes.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-emerald-500/8 px-3 py-1.5 text-sm">
                                    <span className="truncate text-gray-300">{a.challenges?.title || "Unknown"} <span className="text-xs text-gray-600">Dag {a.day}</span></span>
                                    <span className="ml-2 flex shrink-0 items-center gap-1">
                                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">+{a.challenges?.points}</span>
                                      {a.bonus_completed && a.challenges?.bonus_points ? <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[11px] font-bold text-yellow-400">+{a.challenges.bonus_points} 🌟</span> : null}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          {skippedOnes.length > 0 && (
                            <details>
                              <summary className="mb-1 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-red-400">Geskipt ({skippedOnes.length})</summary>
                              <div className="space-y-1">
                                {skippedOnes.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-red-500/8 px-3 py-1.5 text-sm">
                                    <span className="truncate text-gray-500 line-through">{a.challenges?.title || "Unknown"}</span>
                                    <span className="ml-2 shrink-0 text-xs font-bold text-red-400">-10</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          {expiredOnes.length > 0 && (
                            <details>
                              <summary className="mb-1 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-gray-500">Te laat makker ({expiredOnes.length})</summary>
                              <div className="space-y-1">
                                {expiredOnes.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-3 py-1.5 text-sm">
                                    <span className="truncate text-gray-500">{a.challenges?.title || "Unknown"}</span>
                                    <span className="ml-2 shrink-0 text-xs text-gray-600">0</span>
                                  </div>
                                ))}
                              </div>
                            </details>
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

            {/* Stats sub-tab */}
            {challengeSubTab === "stats" && entries.length > 0 && (() => {
              const totalCompleted = entries.reduce((s, e) => s + e.completed_count, 0);
              const totalSkipped = entries.reduce((s, e) => s + e.skipped_count, 0);
              const totalExpired = entries.reduce((s, e) => s + (e.expired_count || 0), 0);
              const totalBonus = entries.reduce((s, e) => s + e.bonus_earned, 0);
              const totalPoints = entries.reduce((s, e) => s + e.total_points, 0);
              const leader = entries[0];
              const loser = entries[entries.length - 1];
              const mostCompleted = [...entries].sort((a, b) => b.completed_count - a.completed_count)[0];
              const mostSkipped = [...entries].sort((a, b) => b.skipped_count - a.skipped_count)[0];
              const mostBonus = [...entries].sort((a, b) => b.bonus_earned - a.bonus_earned)[0];
              // Completion rate per player
              const playerRates = entries.map((e) => {
                const total = e.completed_count + e.skipped_count + (e.expired_count || 0);
                const rate = total > 0 ? Math.round((e.completed_count / total) * 100) : 0;
                return { name: e.name, rate, total };
              }).sort((a, b) => b.rate - a.rate);

              // Categories breakdown
              const categoryCount: Record<string, number> = {};
              allAssignments.filter((a) => a.status === "completed").forEach((a) => {
                const cat = a.challenges?.categories?.name || "Overig";
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
              });
              const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

              // Difficulty breakdown
              const diffCount: Record<string, number> = {};
              allAssignments.filter((a) => a.status === "completed").forEach((a) => {
                const diff = a.challenges?.difficulty || "unknown";
                diffCount[diff] = (diffCount[diff] || 0) + 1;
              });

              // Per-player difficulty stats
              const playerDiffStats: Record<string, Record<string, number>> = {};
              entries.forEach((e) => { playerDiffStats[e.name] = {}; });
              allAssignments.filter((a) => a.status === "completed").forEach((a) => {
                const name = a.users?.name;
                const diff = a.challenges?.difficulty || "unknown";
                if (name && playerDiffStats[name]) {
                  playerDiffStats[name][diff] = (playerDiffStats[name][diff] || 0) + 1;
                }
              });

              // Most hard challenges completed
              const hardRanking = entries.map((e) => ({
                name: e.name,
                hard: (playerDiffStats[e.name]?.hard || 0) + (playerDiffStats[e.name]?.extreme || 0),
              })).sort((a, b) => b.hard - a.hard);
              const hardKing = hardRanking[0];

              // Highest single challenge points earned
              let biggestChallenge = { name: "", title: "", points: 0 };
              allAssignments.filter((a) => a.status === "completed").forEach((a) => {
                const pts = (a.challenges?.points || 0) + (a.bonus_completed ? (a.challenges?.bonus_points || 0) : 0);
                if (pts > biggestChallenge.points) {
                  biggestChallenge = { name: a.users?.name || "", title: a.challenges?.title || "", points: pts };
                }
              });

              // Bonus completion rate per player
              const bonusRates = entries.map((e) => {
                const playerCompleted = allAssignments.filter((a) => a.user_id === e.user_id && a.status === "completed");
                const bonusEligible = playerCompleted.filter((a) => a.challenges?.bonus_points && a.challenges.bonus_points > 0);
                const bonusDone = bonusEligible.filter((a) => a.bonus_completed);
                const rate = bonusEligible.length > 0 ? Math.round((bonusDone.length / bonusEligible.length) * 100) : 0;
                return { name: e.name, rate, done: bonusDone.length, total: bonusEligible.length };
              }).sort((a, b) => b.rate - a.rate);

              // Streak: most challenges completed in a row (by day)
              const playerStreaks = entries.map((e) => {
                const days = allAssignments
                  .filter((a) => a.user_id === e.user_id && a.status === "completed")
                  .map((a) => a.day)
                  .sort((a, b) => a - b);
                let maxStreak = 0, streak = 0, prev = -1;
                days.forEach((d) => {
                  if (d === prev + 1 || d === prev) { streak++; } else { streak = 1; }
                  if (streak > maxStreak) maxStreak = streak;
                  prev = d;
                });
                return { name: e.name, streak: maxStreak };
              }).sort((a, b) => b.streak - a.streak);

              return (
                <div className="space-y-6">
                  {/* === SECTION: OVERZICHT === */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-400/70">📊 Overzicht</p>

                    {/* Hero — Leader vs Last */}
                    {entries.length >= 2 && (
                      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-red-500/5" />
                        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          <div className="flex flex-col items-center gap-1.5">
                            {avatarMap[leader.name] ? (
                              <img src={avatarMap[leader.name]!} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-500/70 shadow-lg shadow-amber-500/20" />
                            ) : (
                              <span className="text-3xl">{emojiMap[leader.name] || "🎮"}</span>
                            )}
                            <p className="text-[10px] font-bold text-amber-400">👑 Leider</p>
                            <p className="text-xs font-extrabold text-white">{leader.name}</p>
                            <p className="text-lg font-black text-amber-400">{leader.total_points}pts</p>
                          </div>
                          <div className="flex flex-col items-center px-2">
                            <span className="text-lg font-black text-gray-600">VS</span>
                            <span className="text-[9px] text-gray-600 mt-1">Δ{leader.total_points - loser.total_points}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5">
                            {avatarMap[loser.name] ? (
                              <img src={avatarMap[loser.name]!} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-red-900/70 grayscale-[40%] shadow-lg shadow-red-900/20" />
                            ) : (
                              <span className="text-3xl">{emojiMap[loser.name] || "🎮"}</span>
                            )}
                            <p className="text-[10px] font-bold text-red-400">💀 Laatste</p>
                            <p className="text-xs font-extrabold text-white">{loser.name}</p>
                            <p className="text-lg font-black text-red-400">{loser.total_points}pts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick numbers */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                        <p className="text-lg font-black text-emerald-400">{totalCompleted}</p>
                        <p className="text-[9px] text-gray-500 font-medium">gedaan</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                        <p className="text-lg font-black text-red-400">{totalSkipped}</p>
                        <p className="text-[9px] text-gray-500 font-medium">geskipt</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                        <p className="text-lg font-black text-yellow-400">{totalBonus}</p>
                        <p className="text-[9px] text-gray-500 font-medium">bonus</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                        <p className="text-lg font-black text-amber-400">{totalPoints}</p>
                        <p className="text-[9px] text-gray-500 font-medium">totaal</p>
                      </div>
                    </div>
                  </div>

                  {/* === SECTION: PRESTATIES === */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-400/70">🏅 Prestaties</p>

                    {/* Completion rate bars */}
                    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Completion Rate</p>
                      {playerRates.map((pr) => {
                        const isTop = pr.rate === playerRates[0].rate;
                        const isBottom = pr.rate === playerRates[playerRates.length - 1].rate && playerRates[0].rate > pr.rate;
                        const barColor = isTop ? "from-amber-500 to-yellow-400" : isBottom ? "from-red-600 to-red-400" : "from-slate-500 to-slate-400";
                        const textColor = isTop ? "text-amber-400" : isBottom ? "text-red-400" : "text-gray-400";
                        return (
                          <div key={pr.name} className="flex items-center gap-3">
                            {avatarMap[pr.name] ? (
                              <img src={avatarMap[pr.name]!} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm">{emojiMap[pr.name] || "🎮"}</span>
                            )}
                            <span className={`text-xs font-bold w-14 truncate ${textColor}`}>{pr.name}</span>
                            <div className="flex-1 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${Math.max(pr.rate, 4)}%` }} />
                            </div>
                            <span className={`text-xs font-black w-10 text-right tabular-nums ${textColor}`}>{pr.rate}%</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hard Challenge King */}
                    {hardKing.hard > 0 && (
                      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-3 mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">🔥 Hard/Extreme Gedaan</p>
                        {hardRanking.map((hr) => (
                          <div key={hr.name} className="flex items-center gap-3">
                            {avatarMap[hr.name] ? (
                              <img src={avatarMap[hr.name]!} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm">{emojiMap[hr.name] || "🎮"}</span>
                            )}
                            <span className="text-xs font-bold text-white flex-1 truncate">{hr.name}</span>
                            <span className={`text-xs font-black tabular-nums ${hr.hard === hardKing.hard ? "text-orange-400" : "text-gray-500"}`}>{hr.hard}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bonus completion rate */}
                    {bonusRates.some((b) => b.total > 0) && (
                      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">⭐ Bonus Completion</p>
                        {bonusRates.map((br) => {
                          const barColor = br.rate >= 80 ? "from-yellow-500 to-yellow-400" : br.rate >= 50 ? "from-slate-500 to-slate-400" : "from-red-600 to-red-400";
                          const textColor = br.rate >= 80 ? "text-yellow-400" : br.rate >= 50 ? "text-gray-400" : "text-red-400";
                          return (
                            <div key={br.name} className="flex items-center gap-3">
                              {avatarMap[br.name] ? (
                                <img src={avatarMap[br.name]!} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <span className="text-sm">{emojiMap[br.name] || "🎮"}</span>
                              )}
                              <span className={`text-xs font-bold w-14 truncate ${textColor}`}>{br.name}</span>
                              <div className="flex-1 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${Math.max(br.rate, 4)}%` }} />
                              </div>
                              <span className={`text-[10px] font-black w-16 text-right tabular-nums ${textColor}`}>{br.done}/{br.total} ({br.rate}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* === SECTION: BREAKDOWN === */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-400/70">📋 Breakdown</p>

                    {/* Per-player breakdown */}
                    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-2.5 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Per Speler</p>
                      {entries.map((e) => (
                        <div key={e.user_id} className="flex items-center gap-3 py-1">
                          {avatarMap[e.name] ? (
                            <img src={avatarMap[e.name]!} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <span className="text-lg">{emojiMap[e.name] || "🎮"}</span>
                          )}
                          <span className="text-xs font-bold text-white flex-1 truncate">{e.name}</span>
                          <div className="flex gap-3 text-right">
                            <div>
                              <p className="text-xs font-black text-emerald-400 tabular-nums">{e.completed_count}</p>
                              <p className="text-[8px] text-gray-600">done</p>
                            </div>
                            <div>
                              <p className="text-xs font-black text-red-400 tabular-nums">{e.skipped_count}</p>
                              <p className="text-[8px] text-gray-600">skip</p>
                            </div>
                            <div>
                              <p className="text-xs font-black text-yellow-400 tabular-nums">{e.bonus_earned}</p>
                              <p className="text-[8px] text-gray-600">bonus</p>
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-400 tabular-nums">{e.total_points}</p>
                              <p className="text-[8px] text-gray-600">pts</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Categories & Difficulty */}
                    <div className="grid grid-cols-2 gap-3">
                      {topCategories.length > 0 && (
                        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-3 space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Categorieën</p>
                          {topCategories.slice(0, 4).map(([cat, count]) => (
                            <div key={cat} className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 truncate">{cat}</span>
                              <span className="text-[10px] font-black text-emerald-400">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {Object.keys(diffCount).length > 0 && (
                        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-3 space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Moeilijkheid</p>
                          {Object.entries(diffCount).sort((a, b) => b[1] - a[1]).map(([diff, count]) => (
                            <div key={diff} className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 capitalize">{diff}</span>
                              <span className="text-[10px] font-black text-purple-400">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* === SECTION: WEETJES === */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-400/70">💬 Weetjes</p>
                    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-2.5">
                      {biggestChallenge.points > 0 && (
                        <p className="text-[11px] text-gray-400">
                          🎯 <span className="font-bold text-white">{biggestChallenge.name}</span> haalde de dikste challenge: &quot;{biggestChallenge.title}&quot; voor <span className="font-bold text-emerald-400">{biggestChallenge.points}pts</span>
                        </p>
                      )}
                      {hardKing.hard > 0 && (
                        <p className="text-[11px] text-gray-400">
                          🔥 <span className="font-bold text-white">{hardKing.name}</span> deed de meeste moeilijke challenges ({hardKing.hard}x hard/extreme)
                        </p>
                      )}
                      {playerStreaks[0].streak > 1 && (
                        <p className="text-[11px] text-gray-400">
                          🔗 <span className="font-bold text-white">{playerStreaks[0].name}</span> heeft de langste streak: {playerStreaks[0].streak} challenges op rij
                        </p>
                      )}
                      {mostSkipped.skipped_count > 0 && (
                        <p className="text-[11px] text-gray-400">
                          🐔 <span className="font-bold text-white">{mostSkipped.name}</span> was de grootste pussy ({mostSkipped.skipped_count}x geskipt)
                        </p>
                      )}
                      {bonusRates[0].total > 0 && (
                        <p className="text-[11px] text-gray-400">
                          ⭐ <span className="font-bold text-white">{bonusRates[0].name}</span> doet het best op bonussen ({bonusRates[0].rate}% gehaald)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Chinese Fucking Scoreboard */}
        {tab === "chinese" && (() => {
          const stats = getCFStats();
          const sorted = [...CF_PLAYERS].sort((a, b) => stats[b].points - stats[a].points || stats[b].wins - stats[a].wins);

          return (
            <div>
              {/* Sub-tabs — minimal underline style */}
              <div className="mb-5 flex border-b border-slate-700/50">
                {([["ranking", "Ranking"], ["stats", "Stats"], ["sessies", "Sessies"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCfSubTab(key)}
                    className={`flex-1 pb-2.5 text-xs font-bold transition-all ${
                      cfSubTab === key
                        ? "text-red-400 border-b-2 border-red-500"
                        : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Ranking sub-tab */}
              {cfSubTab === "ranking" && (
                <>
                  <div className="space-y-2.5">
                    {sorted.map((playerName, i) => {
                      const s = stats[playerName];
                      const CF_META = [
                        { medal: "🥇", title: "Koning Fucker",   titleColor: "text-red-400",    card: "border-red-500/40 bg-gradient-to-r from-red-500/15 via-slate-800/60 to-transparent" },
                        { medal: "🥈", title: "Goeie Poeper",    titleColor: "text-slate-300",   card: "border-slate-500/30 bg-gradient-to-r from-slate-500/8 via-slate-800/60 to-transparent" },
                        { medal: "🥉", title: "Chinees Poepslaafje", titleColor: "text-orange-400", card: "border-orange-700/30 bg-gradient-to-r from-orange-700/8 via-slate-800/60 to-transparent" },
                        { medal: "💀", title: "ik word Chinees GEpoept", titleColor: "text-gray-500", card: "border-red-900/30 bg-gradient-to-r from-red-900/8 via-slate-800/60 to-transparent" },
                      ];
                      const cm = CF_META[Math.min(i, 3)];

                      return (
                        <div key={playerName} className={`rounded-2xl border p-4 shadow-lg ${cm.card}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                              <span className="text-2xl leading-none">{cm.medal}</span>
                              <span className={`text-[9px] font-bold leading-none ${cm.titleColor}`}>{cm.title}</span>
                            </div>
                            {avatarMap[playerName] ? (
                              <button onClick={() => setViewingProfile({ name: playerName, url: avatarMap[playerName]! })} className="shrink-0">
                                <img src={avatarMap[playerName]!} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-red-500/40 transition active:scale-110" />
                              </button>
                            ) : (
                              <span className="shrink-0 text-3xl leading-none">{emojiMap[playerName] || "🎮"}</span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-white">
                                {playerName}
                                {playerName === user.name && <span className="text-xs font-normal text-gray-500">(gij)</span>}
                              </p>
                              <p className="text-xs text-gray-500">🏆 {s.wins} wins · {s.sessions} sessies</p>
                            </div>
                            <p className={`shrink-0 text-3xl font-black tabular-nums ${s.points > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                              {s.points}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                </>
              )}

              {/* Stats sub-tab */}
              {cfSubTab === "stats" && (
                <>
                  {cfSessions.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">Nog geen sessies gespeeld</p>
                  ) : (() => {
                    const totalSessions = cfSessions.length;
                    const totalPts = Object.values(stats).reduce((s, p) => s + p.points, 0);
                    const maxWins = Math.max(...CF_PLAYERS.map((p) => stats[p].wins));
                    const minWins = Math.min(...CF_PLAYERS.map((p) => stats[p].wins));
                    const mostWinsPlayers = CF_PLAYERS.filter((p) => stats[p].wins === maxWins);
                    const leastWinsPlayers = CF_PLAYERS.filter((p) => stats[p].wins === minWins);
                    let highestSessionScore = 0;
                    let highestSessionPlayer = "";
                    cfSessions.forEach((session) => {
                      CF_PLAYERS.forEach((p) => {
                        const pts = session.scores[p] || 0;
                        if (pts > highestSessionScore) { highestSessionScore = pts; highestSessionPlayer = p; }
                      });
                    });
                    const avgPerSession = totalSessions > 0 ? Math.round(totalPts / totalSessions / CF_PLAYERS.length) : 0;
                    const playersByWinPct = [...CF_PLAYERS].sort((a, b) => stats[b].wins - stats[a].wins);

                    return (
                      <div className="space-y-6">
                        {/* === SECTION: OVERZICHT === */}
                        <div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-red-400/70">📊 Overzicht</p>

                          {/* Hero section — King vs Loser face-off */}
                          {maxWins > 0 && (
                            <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 mb-4">
                              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-red-500/5" />
                              <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                {/* King side */}
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="flex -space-x-2">
                                    {mostWinsPlayers.map((p) => (
                                      avatarMap[p] ? (
                                        <img key={p} src={avatarMap[p]!} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-500/70 shadow-lg shadow-amber-500/20" />
                                      ) : (
                                        <span key={p} className="text-3xl">{emojiMap[p] || "🎮"}</span>
                                      )
                                    ))}
                                  </div>
                                  <p className="text-[10px] font-bold text-amber-400">👑 {mostWinsPlayers.length > 1 ? "Kings" : "King"}</p>
                                  <p className="text-xs font-extrabold text-white text-center">{mostWinsPlayers.join(" & ")}</p>
                                  <p className="text-lg font-black text-amber-400">{maxWins}W</p>
                                </div>

                                {/* VS */}
                                <div className="flex flex-col items-center px-2">
                                  <span className="text-lg font-black text-gray-600">VS</span>
                                </div>

                                {/* Loser side */}
                                <div className="flex flex-col items-center gap-1.5">
                                  {minWins < maxWins ? (
                                    <>
                                      <div className="flex -space-x-2">
                                        {leastWinsPlayers.map((p) => (
                                          avatarMap[p] ? (
                                            <img key={p} src={avatarMap[p]!} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-red-900/70 grayscale-[40%] shadow-lg shadow-red-900/20" />
                                          ) : (
                                            <span key={p} className="text-3xl">{emojiMap[p] || "🎮"}</span>
                                          )
                                        ))}
                                      </div>
                                      <p className="text-[10px] font-bold text-red-400">💀 {leastWinsPlayers.length > 1 ? "Poepslaafjes" : "Poepslaafje"}</p>
                                      <p className="text-xs font-extrabold text-white text-center">{leastWinsPlayers.join(" & ")}</p>
                                      <p className="text-lg font-black text-red-400">{minWins}W</p>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-3xl">🤝</span>
                                      <p className="text-[10px] font-bold text-gray-400">Gelijk</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick numbers */}
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                              <p className="text-lg font-black text-red-400">{totalSessions}</p>
                              <p className="text-[9px] text-gray-500 font-medium">sessies</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                              <p className="text-lg font-black text-emerald-400">{totalPts}</p>
                              <p className="text-[9px] text-gray-500 font-medium">totaal</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                              <p className="text-lg font-black text-purple-400">{highestSessionScore}</p>
                              <p className="text-[9px] text-gray-500 font-medium">record</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-2.5">
                              <p className="text-lg font-black text-cyan-400">{avgPerSession}</p>
                              <p className="text-[9px] text-gray-500 font-medium">gem.</p>
                            </div>
                          </div>
                        </div>

                        {/* === SECTION: WIN STATS === */}
                        <div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-red-400/70">🏆 Win Stats</p>

                          {/* Win rate bars — all players */}
                          {totalSessions > 0 && (
                            <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Win Rate</p>
                              {playersByWinPct.map((p) => {
                                const winPct = Math.round((stats[p].wins / totalSessions) * 100);
                                const isTop = stats[p].wins === maxWins && maxWins > 0;
                                const isBottom = stats[p].wins === minWins && minWins < maxWins;
                                const barColor = isTop ? "from-amber-500 to-yellow-400" : isBottom ? "from-red-600 to-red-400" : "from-slate-500 to-slate-400";
                                const textColor = isTop ? "text-amber-400" : isBottom ? "text-red-400" : "text-gray-400";
                                return (
                                  <div key={p} className="flex items-center gap-3">
                                    {avatarMap[p] ? (
                                      <img src={avatarMap[p]!} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                      <span className="text-sm">{emojiMap[p] || "🎮"}</span>
                                    )}
                                    <span className={`text-xs font-bold w-14 truncate ${textColor}`}>{p}</span>
                                    <div className="flex-1 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                                      <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${Math.max(winPct, 4)}%` }} />
                                    </div>
                                    <span className={`text-xs font-black w-10 text-right tabular-nums ${textColor}`}>{winPct}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* === SECTION: BREAKDOWN === */}
                        <div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-red-400/70">📋 Breakdown</p>

                          {/* Per-player breakdown */}
                          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Per Speler</p>
                            {sorted.map((p) => {
                              const avg = stats[p].sessions > 0 ? Math.round(stats[p].points / stats[p].sessions) : 0;
                              return (
                                <div key={p} className="flex items-center gap-3 py-1">
                                  {avatarMap[p] ? (
                                    <img src={avatarMap[p]!} alt="" className="h-7 w-7 rounded-full object-cover" />
                                  ) : (
                                    <span className="text-lg">{emojiMap[p] || "🎮"}</span>
                                  )}
                                  <span className="text-xs font-bold text-white flex-1 truncate">{p}</span>
                                  <div className="flex gap-3 text-right">
                                    <div>
                                      <p className="text-xs font-black text-emerald-400 tabular-nums">{stats[p].points}</p>
                                      <p className="text-[8px] text-gray-600">pts</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-amber-400 tabular-nums">{stats[p].wins}</p>
                                      <p className="text-[8px] text-gray-600">wins</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-cyan-400 tabular-nums">{avg}</p>
                                      <p className="text-[8px] text-gray-600">gem</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* === SECTION: WEETJES === */}
                        <div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-red-400/70">💬 Weetjes</p>
                          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-2.5">
                            {highestSessionScore > 0 && (
                              <p className="text-[11px] text-gray-400">
                                🔥 <span className="font-bold text-white">{highestSessionPlayer}</span> scoorde het record van <span className="font-bold text-purple-400">{highestSessionScore}</span> in één sessie
                              </p>
                            )}
                            {maxWins > 0 && mostWinsPlayers.length === 1 && (
                              <p className="text-[11px] text-gray-400">
                                👑 <span className="font-bold text-white">{mostWinsPlayers[0]}</span> domineert met {maxWins} van de {totalSessions} sessies gewonnen
                              </p>
                            )}
                            {avgPerSession > 0 && (
                              <p className="text-[11px] text-gray-400">
                                📊 Gemiddeld scoort iedereen <span className="font-bold text-cyan-400">{avgPerSession}</span> per sessie
                              </p>
                            )}
                            {minWins < maxWins && leastWinsPlayers.length === 1 && (
                              <p className="text-[11px] text-gray-400">
                                💀 <span className="font-bold text-white">{leastWinsPlayers[0]}</span> wint nooit, absolute poepslaaf
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Sessies sub-tab */}
              {cfSubTab === "sessies" && (
                <>
                  {/* Add session (Anton only) */}
                  {isAnton && !showAddSession && (
                    <button
                      onClick={() => setShowAddSession(true)}
                      className="mb-4 w-full rounded-2xl border border-dashed border-red-500/30 bg-red-900/10 py-3 text-sm font-bold text-red-400 transition hover:bg-red-900/20 active:scale-[0.98]"
                    >
                      + Nieuwe sessie toevoegen
                    </button>
                  )}
                  {isAnton && showAddSession && (
                    <div className="mb-4 rounded-2xl border border-red-500/30 bg-slate-800/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">🎲 Nieuwe sessie</p>
                        <select
                          value={sessionDay}
                          onChange={(e) => setSessionDay(parseInt(e.target.value))}
                          className="rounded-lg border border-slate-600 bg-slate-700/50 px-2 py-1 text-xs text-white focus:border-red-500 focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <option key={d} value={d}>Dag {d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CF_PLAYERS.map((p) => (
                          <div key={p} className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400">{p}</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              placeholder="0"
                              value={sessionScores[p] || ""}
                              onChange={(e) => setSessionScores((prev) => ({ ...prev, [p]: e.target.value }))}
                              className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowAddSession(false); setSessionScores({}); }}
                          className="flex-1 rounded-xl bg-slate-700 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-slate-600 active:scale-95"
                        >
                          Annuleer
                        </button>
                        <button
                          onClick={handleAddSession}
                          disabled={cfLoading}
                          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-500 active:scale-95 disabled:opacity-50"
                        >
                          {cfLoading ? "..." : "Opslaan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sessions list */}
                  {cfSessions.length === 0 && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 text-center text-gray-400">
                      Nog geen sessies gespeeld
                    </div>
                  )}
                  <div className="space-y-2">
                    {[...cfSessions].reverse().map((session, idx) => {
                      const scores = session.scores || {};
                      const maxPts = Math.max(...Object.values(scores), 0);
                      const winners = Object.entries(scores).filter(([, v]) => v === maxPts && maxPts > 0);
                      const winner = winners.length === 1 ? winners[0][0] : null;
                      return (
                        <div key={session.id} className="rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500">Dag {session.day} · Sessie {cfSessions.length - idx}</span>
                            <div className="flex items-center gap-2">
                              {winner && <span className="text-[10px] text-amber-400">🏆 {winner}</span>}
                              {isAnton && (
                                <button onClick={() => handleDeleteSession(session.id)} className="text-[10px] text-red-500/60 hover:text-red-400">✕</button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {CF_PLAYERS.map((p) => (
                              <div key={p} className={`flex-1 rounded-lg px-2 py-1 text-center ${winner === p ? "bg-amber-500/15" : "bg-slate-700/30"}`}>
                                <p className="text-[10px] text-gray-500 truncate">{p}</p>
                                <p className={`text-sm font-bold ${winner === p ? "text-amber-400" : "text-gray-300"}`}>{scores[p] || 0}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}
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
