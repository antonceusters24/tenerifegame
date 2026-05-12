"use client";

import { useState } from "react";
import { User } from "@/lib/types";
import { logout } from "../actions";
import { getCurrentDay, getGameStatus } from "@/lib/game";
import Link from "next/link";

type AssignmentRow = {
  id: string;
  user_id: string;
  challenge_id: string;
  day: number;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  target_player_name: string | null;
  bonus_completed: boolean;
  challenges: {
    id: string;
    title: string;
    difficulty: string;
    points: number;
    bonus_description: string | null;
    bonus_points: number;
    created_by_admin: string | null;
    categories: { name: string } | null;
  } | null;
  users: { name: string; emoji: string } | null;
};

type PlayerRow = { id: string; name: string; emoji: string };

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  expired: "bg-slate-500/10 text-gray-400 border-slate-600/30",
};

export default function AdminClient({
  user,
  assignments: rawAssignments,
  players,
  totalMyChallenges,
}: {
  user: User;
  assignments: AssignmentRow[];
  players: PlayerRow[];
  totalMyChallenges: number;
}) {
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [showMine, setShowMine] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const currentDay = getCurrentDay();
  const gameStatus = getGameStatus();
  const adminName = user.name.replace(" (Admin)", "");

  // Normalize statuses: pending → active, then expired if day has passed
  const assignments = rawAssignments.map((a) => {
    const status = a.status === "pending" ? "active" : a.status;
    if (status === "active") {
      // Game is over — all remaining active are expired
      if (gameStatus === "after") return { ...a, status: "expired" };
      // Day has passed during active game
      if (currentDay && a.day < currentDay) return { ...a, status: "expired" };
      return { ...a, status: "active" };
    }
    return { ...a, status };
  });

  // Get unique days from assignments
  const days = Array.from(new Set(assignments.map((a) => a.day))).sort((a, b) => a - b);

  // Filter assignments
  let filteredAssignments = assignments;
  if (dayFilter !== "all") {
    filteredAssignments = filteredAssignments.filter((a) => a.day === dayFilter);
  }
  if (playerFilter !== "all") {
    filteredAssignments = filteredAssignments.filter((a) => a.user_id === playerFilter);
  }
  if (showMine) {
    filteredAssignments = filteredAssignments.filter((a) => a.challenges?.created_by_admin === adminName);
  }

  // "Mijn" stats
  const myAssignedCount = assignments.filter((a) => a.challenges?.created_by_admin === adminName).length;
  const myWaitingCount = totalMyChallenges - myAssignedCount;

  // Group assignments by player
  const assignmentsByPlayer = new Map<string, AssignmentRow[]>();
  filteredAssignments.forEach((a) => {
    const playerName = a.users?.name || "Unknown";
    if (!assignmentsByPlayer.has(playerName)) {
      assignmentsByPlayer.set(playerName, []);
    }
    assignmentsByPlayer.get(playerName)!.push(a);
  });

  // Stats
  const activeCount = assignments.filter((a) => a.status === "active").length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const expiredCount = assignments.filter((a) => a.status === "expired").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-5 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-slate-800/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-2xl">
              ⚙️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">
                {assignments.length} actieve/voltooide opdrachten · {players.length} spelers
              </p>
            </div>
            {/* Menu button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-gray-400 transition hover:bg-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} aria-hidden />
                  <div className="fixed right-4 top-20 z-50 min-w-[180px] rounded-xl border border-slate-700/50 bg-slate-800/95 p-1.5 shadow-xl backdrop-blur">
                    <Link
                      href="/admin/challenges"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                    >
                      <span>Challenges beheren</span>
                    </Link>
                    <Link
                      href="/scoreboard"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                    >
                      <span>Scoreboard</span>
                    </Link>
                    {user.name === "Anton" && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                      >
                        <span>Spelers bannen</span>
                      </Link>
                    )}
                    <form action={logout}>
                      <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-slate-700">
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats row inside header card */}
          <div className="mt-3 flex gap-1.5">
            {[
              { count: activeCount, label: "Actief", color: "text-blue-400" },
              { count: completedCount, label: "Klaar", color: "text-emerald-400" },
              { count: expiredCount, label: "Verlopen", color: "text-gray-500" },
            ].map((s) => (
              <div key={s.label} className="flex-1 rounded-lg bg-slate-900/50 py-1.5 text-center">
                <p className={`text-sm font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[9px] text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-2">
          {/* Day filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 shrink-0">Dag</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setDayFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  dayFilter === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                }`}
              >
                Alle
              </button>
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDayFilter(d)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    dayFilter === d
                      ? "bg-amber-500 text-black"
                      : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Player filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 shrink-0">Speler</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPlayerFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  playerFilter === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                }`}
              >
                Alle
              </button>
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlayerFilter(p.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    playerFilter === p.id
                      ? "bg-amber-500 text-black"
                      : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                  }`}
                >
                  {p.name.replace(" (Admin)", "")}
                </button>
              ))}
            </div>
          </div>

          {/* "Mijn" filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 shrink-0">Mijn</span>
            <button
              onClick={() => setShowMine(!showMine)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                showMine
                  ? "bg-purple-500 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Mijn challenges ({myAssignedCount})
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400"></span>Actief</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>Voltooid</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-500"></span>Verlopen</span>
          </div>
        </div>

        {/* Assignments grouped by player */}
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-8 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-medium text-gray-300">Nog geen opdrachten toegewezen</p>
              <p className="mt-1 text-xs text-gray-500">Zodra het spel begint en challenges worden getrokken, verschijnen ze hier.</p>
            </div>
          ) : filteredAssignments.length === 0 && showMine ? (
            <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-8 text-center">
              <p className="text-2xl mb-2">🎲</p>
              <p className="text-sm font-medium text-gray-300">Nog geen van jouw challenges getrokken</p>
              <p className="mt-1 text-xs text-gray-500">
                {myWaitingCount > 0
                  ? `${myWaitingCount} van jouw challenges wachten nog om getrokken te worden.`
                  : "Al jouw challenges zijn al toegewezen!"}
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-8 text-center">
              <p className="text-sm text-gray-400">Geen opdrachten voor deze filters.</p>
            </div>
          ) : (
            Array.from(assignmentsByPlayer.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([playerName, playerAssignments]) => {
                const playerCompleted = playerAssignments.filter((a) => a.status === "completed").length;
                return (
                  <div key={playerName} className="rounded-2xl border border-slate-700/40 bg-slate-800/60 overflow-hidden">
                    {/* Player header */}
                    <div className="flex items-center gap-2.5 border-b border-slate-700/30 px-4 py-2.5 bg-slate-800/80">                      <h3 className="font-bold text-white text-sm">
                        {playerName.replace(" (Admin)", "")}
                      </h3>
                      <span className="ml-auto rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                        {playerCompleted}/{playerAssignments.length}
                      </span>
                    </div>
                    {/* Assignments */}
                    <div className="divide-y divide-slate-700/20">
                      {playerAssignments
                        .sort((a, b) => a.day - b.day)
                        .map((a) => (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2.5 px-4 py-2.5 ${STATUS_COLORS[a.status] || STATUS_COLORS.active}`}
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900/50 text-[10px] font-black text-gray-500">
                              {a.day}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {a.challenges?.title || "?"}
                              </p>
                              <p className="text-[10px] opacity-60">
                                {a.challenges?.categories?.name} · {a.challenges?.difficulty} · {a.challenges?.points}pts
                                {a.challenges?.bonus_points ? ` · +${a.challenges.bonus_points}🌟` : ""}
                                {a.target_player_name && (
                                  <span className="ml-1">🎯 {a.target_player_name}</span>
                                )}
                              </p>
                            </div>
                            <span className="shrink-0">
                              <span className={`inline-block h-3 w-3 rounded-full ${
                                a.status === "active" ? "bg-blue-400" :
                                a.status === "completed" ? "bg-emerald-400" :
                                "bg-gray-500"
                              }`}></span>
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
