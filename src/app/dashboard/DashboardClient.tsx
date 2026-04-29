"use client";

import { useState, useCallback, useEffect } from "react";
import { User, Assignment, PendingConfirmation } from "@/lib/types";
import {
  getGameStatus,
  getCurrentDay,
  ACTIVATION_TIME,
  GAME_DATES,
  challengesAvailable,
} from "@/lib/game";
import {
  completeChallenge,
  skipChallenge,
  requestNewChallenge,
  confirmChallenge,
  rejectChallenge,
  logout,
  updateEmoji,
} from "../actions";
import Link from "next/link";
import RandomImage from "@/components/RandomImage";
import ChallengeReveal from "@/components/ChallengeReveal";
import EasterEggs from "@/components/EasterEggs";

const DAY_NAMES = [
  { name: "De aankomst", emoji: "🛬", subtitle: "Stilte voor de storm" },
  { name: "De oepwarming", emoji: "🔥", subtitle: "Alleman fris en fruitig, zuipeeee" },
  { name: "Den doorzetter", emoji: "💪", subtitle: "Vandaag wordt het nog steviger eh mannen" },
  { name: "Den halve", emoji: "⚡", subtitle: "Zen al wijt halverwege, tandje bijsteken nouw" },
  { name: "Afzien", emoji: "🥵", subtitle: "Hier worden de grote mannen van de kleine jongens gescheiden" },
  { name: "De Climax", emoji: "🏔️", subtitle: "Gisteren was niks, vandaag gaat het los" },
  { name: "Het finaal gevecht", emoji: "👑", subtitle: "Laatste kans om u te bewijzen, legend" },
];

function DayTracker({ day }: { day: number }) {
  const info = DAY_NAMES[day - 1] || DAY_NAMES[0];
  const progress = (day / 7) * 100;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border border-amber-500/20 bg-slate-800/60 px-3 py-2">
      <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">Dag {day}/7</span>
        <span className="text-sm font-bold text-amber-400">{info.emoji} {info.name}</span>
        <span className="text-[10px] text-gray-500">{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && (
        <>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] italic text-gray-500">&ldquo;{info.subtitle}&rdquo;</p>
        </>
      )}
    </div>
  );
}

export default function DashboardClient({
  user,
  assignments: initial,
  pendingConfirmations: initialPending,
  players: initialPlayers,
}: {
  user: User;
  assignments: Assignment[];
  pendingConfirmations: PendingConfirmation[];
  players: { name: string; emoji: string; avatar_url: string | null }[];
}) {
  const [assignments, setAssignments] = useState(initial);
  const [pending, setPending] = useState(initialPending);
  const [players, setPlayers] = useState(initialPlayers);
  const [loading, setLoading] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [revealAnim, setRevealAnim] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [emojiInput, setEmojiInput] = useState(user.emoji || "");
  const [uploading, setUploading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ name: string; url: string } | null>(null);

  const gameStatus = getGameStatus();
  const currentDay = getCurrentDay();

  useEffect(() => {
    function update() {
      const target = new Date(ACTIVATION_TIME).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const active = assignments.filter((a) => a.status === "active");
  const pendingOwn = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => a.status === "completed");
  const skipped = assignments.filter((a) => a.status === "skipped");

  async function handleComplete(id: string) {
    setLoading(id);
    const res = await completeChallenge(id);
    if (!("error" in res)) {
      const newStatus = user.name === "Anton" ? "completed" : "pending";
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: newStatus as "completed" | "pending" } : a
        )
      );
    }
    setLoading(null);
  }

  async function handleSkip(id: string) {
    if (!confirm("Skippen? Da kost u 10 punten, lafaard!")) return;
    setLoading(id);
    const res = await skipChallenge(id);
    if (!("error" in res)) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "skipped" as const } : a
        )
      );
    }
    setLoading(null);
  }

  async function handleRequestNew() {
    const day = currentDay || 1;
    setLoading("new");
    // Pick a random animation type
    setRevealAnim(Math.floor(Math.random() * 10));
    // Start the animation
    setShowReveal(true);
    // Request the challenge in the background
    await requestNewChallenge(day);
  }

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    setLoading(null);
    window.location.reload();
  }, []);

  async function handleConfirm(id: string) {
    setLoading(id);
    const res = await confirmChallenge(id);
    if (!("error" in res)) {
      setPending((prev) => prev.filter((p) => p.id !== id));
    } else if ("error" in res) {
      alert(res.error);
    }
    setLoading(null);
  }

  async function handleReject(id: string) {
    setLoading(id);
    const res = await rejectChallenge(id);
    if (!("error" in res)) {
      setPending((prev) => prev.filter((p) => p.id !== id));
    }
    setLoading(null);
  }

  const difficultyColor = {
    easy: "bg-emerald-900/50 text-emerald-300",
    medium: "bg-amber-900/50 text-amber-300",
    hard: "bg-red-900/50 text-red-300",
  };

  const EMOJI_OPTIONS = ["🥚", "🐆", "🚬", "🍆", "🍺", "🔥", "💀", "🎯", "👑", "🦈", "🐒", "🌴", "🎲", "💣", "🧨", "🍻", "🥃", "🏖️", "☀️", "🤙", "😎", "🤯", "🫡", "💪"];

  async function handleEmojiChange(emoji: string) {
    setShowEmojiPicker(false);
    const res = await updateEmoji(emoji);
    if (!("error" in res)) {
      user.emoji = emoji;
      user.avatar_url = null;
      setPlayers((prev) => prev.map((p) => p.name === user.name ? { ...p, emoji, avatar_url: null } : p));
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (data.avatar_url) {
        user.avatar_url = data.avatar_url;
        setPlayers((prev) => prev.map((p) => p.name === user.name ? { ...p, avatar_url: data.avatar_url } : p));
        setShowEmojiPicker(false);
      }
    } catch {
      alert("Upload mislukt");
    }
    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      {gameStatus === "active" && <RandomImage />}
      {gameStatus === "active" && <EasterEggs />}
      <div className="relative z-10 mx-auto max-w-lg">
        {/* Header / Profile */}
        <div className="mb-5 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-slate-800/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Avatar / Emoji */}
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="relative group shrink-0"
              title="Verander je emoji/foto"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/70 shadow-lg shadow-amber-500/20" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10">
                  {user.emoji || "🎮"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition flex items-center justify-center">
                <span className="text-xs text-white">✏️</span>
              </div>
            </button>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-white truncate">{user.name}</h1>
              <p className="text-xs text-gray-400">
                {gameStatus === "active" && currentDay
                  ? `Dag ${currentDay} · ${completed.length} challenges gedaan`
                  : gameStatus === "active"
                  ? "Game is live! 🎉"
                  : "Countdown loopt..."}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {gameStatus === "active" && (
                <Link
                  href="/gallery"
                  className="rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-slate-700"
                >
                  📸
                </Link>
              )}
              {gameStatus === "active" && (
                <Link
                  href="/scoreboard"
                  className="rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-slate-700"
                >
                  🏆
                </Link>
              )}
              {(completed.length > 0 || skipped.length > 0) && (
                <button
                  onClick={() => setShowHistory((h) => !h)}
                  className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                    showHistory
                      ? "bg-amber-500 text-black"
                      : "bg-slate-700/50 text-amber-400 hover:bg-slate-700"
                  }`}
                >
                  📜 {completed.length + skipped.length}
                </button>
              )}
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
          </div>

          {/* Day tracker inside profile card */}
          {gameStatus === "active" && currentDay && (
            <div className="mt-3 border-t border-slate-700/50 pt-3">
              <DayTracker day={currentDay} />
            </div>
          )}
        </div>

        {/* Before game */}
        {gameStatus === "before" && (
          <div className="flex flex-col items-center justify-between pt-4 min-h-[calc(100dvh-120px)]">
            {/* Hero */}
            <div className="mb-4 text-center">
              <div className="relative inline-block">
                <p className="text-7xl animate-bounce" style={{ animationDuration: "3s" }}>🏝️</p>
                <div className="absolute -inset-6 -z-10 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
              </div>
              <h2 className="mt-3 text-5xl font-black tracking-tight text-white" style={{ textShadow: "0 0 40px rgba(245, 158, 11, 0.4), 0 0 80px rgba(245, 158, 11, 0.1)" }}>
                TENERIFE
              </h2>
              <p className="text-2xl font-black text-amber-400" style={{ textShadow: "0 0 20px rgba(245, 158, 11, 0.3)" }}>2026</p>
              <p className="mt-2 text-sm italic font-medium tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent animate-pulse" style={{ animationDuration: "4s" }}>
                &ldquo;Maximaal vruuten, zuipen en vapen&rdquo;
              </p>
            </div>

            {/* Countdown */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-800/80 to-slate-900/80 p-5 text-center shadow-xl shadow-amber-500/5">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/60">
                ⏳ Countdown
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { value: countdown.days, label: "dagen" },
                  { value: countdown.hours, label: "uren" },
                  { value: countdown.minutes, label: "min" },
                  { value: countdown.seconds, label: "sec" },
                ].map((unit) => (
                  <div key={unit.label} className="flex flex-col items-center">
                    <span className="text-3xl font-black text-amber-400 tabular-nums" style={{ textShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}>
                      {String(unit.value).padStart(2, "0")}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-3 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>🛫 12 mei</span>
                <span className="text-amber-400 animate-pulse">→</span>
                <span>🛬 19 mei</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-600">
                7 dagen vermaak, 1 winnaar
              </p>
            </div>

            {/* Crew */}
            <div className="mt-5 w-full">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
                ✈️ Crew
              </p>
              <div className="grid w-full grid-cols-4 gap-2">
                {players.map((player) => (
                  <div
                    key={player.name}
                    className={`rounded-xl border px-2 py-3 flex flex-col items-center justify-center text-center gap-1 transition-all duration-300 hover:scale-105 ${
                      player.name === user.name
                        ? "border-amber-500/50 bg-gradient-to-b from-amber-500/15 to-transparent shadow-lg shadow-amber-500/10"
                        : "border-slate-700/60 bg-slate-800/40"
                    }`}
                  >
                    {player.avatar_url ? (
                      <button onClick={() => setViewingProfile({ name: player.name, url: player.avatar_url! })}>
                        <img src={player.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/40" />
                      </button>
                    ) : (
                      <span className="text-2xl">{player.emoji || "🎮"}</span>
                    )}
                    <p className={`text-xs font-bold ${player.name === user.name ? "text-amber-400" : "text-white"}`}>
                      {player.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Teaser */}
            <div className="relative mt-5 w-full overflow-hidden rounded-2xl border border-dashed border-amber-500/20 bg-slate-800/30 px-4 py-4 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
              <p className="text-base">🤫</p>
              <p className="mt-1 text-xs font-medium text-gray-300 italic">
                Prepare for takeoff, more to come...
              </p>
              <p className="mt-1 text-[10px] text-amber-500/50 italic">
                Bereid je goed voor — meer info volgt op 12 mei.
              </p>
            </div>
          </div>
        )}

        {/* After game */}
        {gameStatus === "after" && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-8 text-center backdrop-blur">
            <p className="mb-2 text-6xl">🏆</p>
            <h2 className="mb-2 text-2xl font-extrabold text-white">
              Game Gedaan!
            </h2>
            <p className="text-gray-400">
              Wa ne reis mannen! Check de finale scores.
            </p>
            <Link
              href="/scoreboard"
              className="mt-4 inline-block rounded-lg bg-amber-500 px-6 py-2 font-bold text-black transition hover:bg-amber-400"
            >
              🏆 Eindklassement
            </Link>
          </div>
        )}

        {/* Game active but challenges not yet (evening of May 12 / day 1) */}
        {gameStatus === "active" && currentDay && !challengesAvailable() && (
          <div className="relative mt-8 flex flex-col items-center text-center">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-transparent blur-sm -z-10" />
            <h2 className="text-3xl font-black text-white drop-shadow-lg" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
              Welkom in Guido&apos;s fokhok!
            </h2>
            <p className="mt-2 text-base font-medium text-gray-200 drop-shadow" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.8)" }}>
              Let the games begin
            </p>
            <p className="mt-4 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-sm">
              ⏳ Vanaf morgenvroeg 9u begint het voor echt...
            </p>
          </div>
        )}

        {/* During game - challenges available */}
        {gameStatus === "active" && currentDay && challengesAvailable() && (
          <>

            {/* Peer Confirmations - only Anton sees this */}
            {user.name === "Anton" && pending.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-bold text-amber-400">
                  👑 Bevestig Deze (Anton)
                </h2>
                <div className="space-y-2">
                  {pending.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 backdrop-blur"
                    >
                      <div className="mb-2">
                        <span className="text-xs text-amber-300">
                          {p.users?.name} zegt:
                        </span>
                        <p className="font-semibold text-white">
                          {p.challenges?.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.challenges?.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirm(p.id)}
                          disabled={loading === p.id}
                          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                          ✅ Klopt
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={loading === p.id}
                          className="flex-1 rounded-lg bg-red-600/80 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          ❌ Gelansen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Challenges - rendered in bottom bar outside this container */}
          </>
        )}

        {/* History panel (toggled) */}
        {showHistory && (completed.length > 0 || skipped.length > 0) && (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/80 p-4 backdrop-blur">
            {completed.length > 0 && (
              <div className="mb-4">
                <h2 className="mb-2 text-sm font-bold text-emerald-400">
                  ✅ Gedaan ({completed.length})
                </h2>
                <div className="space-y-1.5">
                  {completed.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg bg-emerald-500/10 px-3 py-2"
                    >
                      <span className="text-xs text-emerald-300">
                        Dag {a.day} · +{a.challenges?.points}pts
                      </span>
                      <p className="text-sm font-medium text-white">
                        {a.challenges?.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {skipped.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-bold text-red-400">
                  ❌ Geskipt ({skipped.length})
                </h2>
                <div className="space-y-1.5">
                  {skipped.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg bg-red-500/10 px-3 py-2"
                    >
                      <span className="text-xs text-red-300">
                        Dag {a.day} · -10pts
                      </span>
                      <p className="text-sm font-medium text-white/50 line-through">
                        {a.challenges?.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar - active challenges */}
      {gameStatus === "active" && currentDay && challengesAvailable() && (
        <>
          {active.length === 0 && pendingOwn.length === 0 ? (
            <div
              className="border-t border-slate-700 bg-slate-900 p-4 text-center"
              style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={handleRequestNew}
                disabled={loading === "new"}
                className="w-full max-w-lg rounded-xl bg-amber-500 py-3.5 text-lg font-bold text-black transition hover:bg-amber-400 active:scale-95 disabled:opacity-50"
              >
                {loading === "new" ? "Laden..." : "🎲 Fiks nieuwe challenge"}
              </button>
            </div>
          ) : (
            <div
              className="border-t border-slate-700 bg-slate-900 px-4 pt-3"
              style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <div className="mx-auto max-w-lg space-y-3">
                {active.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                        {a.challenges?.categories?.name || "Challenge"}
                      </span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                        +{a.challenges?.points}pts
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      {a.challenges?.title}
                    </h3>
                    {a.target_player_name && (
                      <p className="mt-0.5 text-sm font-semibold text-orange-400">
                        🎯 Op: {a.target_player_name}
                      </p>
                    )}
                    {a.challenges?.description && (
                      <p className="mt-1 text-sm text-gray-400">
                        {a.challenges.description}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleComplete(a.id)}
                        disabled={loading === a.id}
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        ✅ Gedaan!
                      </button>
                      <button
                        onClick={() => handleSkip(a.id)}
                        disabled={loading === a.id}
                        className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        Skip (-10)
                      </button>
                    </div>
                  </div>
                ))}

                {pendingOwn.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-amber-500/30 bg-slate-800/60 p-4 opacity-80"
                  >
                    <span className="text-xs font-medium text-amber-400">
                      ⏳ Wachten op bevestiging van Anton
                    </span>
                    <h3 className="font-bold text-white">
                      {a.challenges?.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      +{a.challenges?.points}pts na bevestiging
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showReveal && (
        <ChallengeReveal
          onComplete={handleRevealComplete}
          animationType={revealAnim}
        />
      )}

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

      {/* Emoji / Avatar Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-4" onClick={() => setShowEmojiPicker(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center text-lg font-bold text-white">Kies emoji of foto</h3>

            {/* Current display */}
            <div className="mb-4 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-500" />
              ) : (
                <span className="text-5xl">{user.emoji || "🎮"}</span>
              )}
            </div>

            {/* Emoji input - opens native keyboard on iPhone */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-400">Typ een emoji (gebruik emoji-toetsenbord)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emojiInput}
                  onChange={(e) => setEmojiInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-center text-2xl text-white focus:border-amber-500 focus:outline-none"
                  placeholder="🎮"
                  autoComplete="off"
                />
                <button
                  onClick={() => { if (emojiInput.trim()) handleEmojiChange(emojiInput.trim()); }}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
                >
                  OK
                </button>
              </div>
            </div>

            {/* Quick emoji picks */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-gray-400">Of kies snel:</p>
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiChange(emoji)}
                    className={`rounded-lg p-1.5 text-xl transition hover:scale-110 hover:bg-slate-700 ${
                      emoji === user.emoji && !user.avatar_url ? "bg-amber-500/20 ring-2 ring-amber-500" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-400">Of upload een foto</label>
              <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-800/50 py-3 text-sm font-medium text-gray-300 transition hover:border-amber-500 hover:text-amber-400 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                {uploading ? "Uploaden..." : "📷 Foto kiezen"}
              </label>
            </div>

            <button
              onClick={() => setShowEmojiPicker(false)}
              className="w-full rounded-lg bg-slate-700 py-2 text-sm font-medium text-gray-300 transition hover:bg-slate-600"
            >
              Annuleer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
