"use client";

import { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { getTable } from "@/lib/tables";
import { User, Assignment, PendingConfirmation } from "@/lib/types";
import {
  getGameStatus,
  getCurrentDay,
  ACTIVATION_TIME,
  GAME_DATES,
  challengesAvailable,
  getNextResetTime,
} from "@/lib/game";
import {
  completeChallenge,
  requestNewChallenge,
  confirmChallenge,
  rejectChallenge,
  undoConfirmChallenge,
  logout,
  updateEmoji,
} from "../actions";
import Link from "next/link";
import RandomImage from "@/components/RandomImage";
import ChallengeReveal from "@/components/ChallengeReveal";

const DAY_NAMES = [
  { name: "De aankomst", emoji: "🛬", subtitle: "Stilte voor de storm" },
  { name: "De oepwarming", emoji: "🔥", subtitle: "Alleman fris en fruitig, zuipeeee" },
  { name: "Alles geven e", emoji: "💪", subtitle: "Vandaag wordt het nog steviger eh mannen" },
  { name: "Oep den helft", emoji: "⚡", subtitle: "Zen al wijt halverwege, tandje bijsteken nouw" },
  { name: "Afzien", emoji: "🥵", subtitle: "Hier worden de grote mannen van de kleine jongens gescheiden" },
  { name: "De Climax", emoji: "🏔️", subtitle: "Gisteren was niks, vandaag gaat het los" },
  { name: "Het finaal gevecht", emoji: "👑", subtitle: "Laatste kans om u te bewijzen, legend" },
];

function DayTracker({ day }: { day: number }) {
  const info = DAY_NAMES[day - 1] || DAY_NAMES[0];
  const progress = (day / 7) * 100;
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center gap-2.5">
        <div className="relative flex-1 h-5 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-md">
            {day}/7
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold text-amber-400">{info.emoji} {info.name}</span>
        <span className="text-xs text-gray-500">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <p className="mt-1.5 text-center text-xs italic text-gray-400">&ldquo;{info.subtitle}&rdquo;</p>
      )}
    </div>
  );
}

const RANK_EMOJI = ["🥇", "🥈", "🥉", "💀"];
const rankEmoji = (r: number) => RANK_EMOJI[Math.min(r, 4) - 1] ?? "💀";

const END_MESSAGES: Record<string, string> = {
  "1-1": "Absolute legend. De allround beste, volwaardig Chinese Fuckerke en challenge koning. Gij hebt Tenerife volledig uitgespeeld Proficiat kameraad",
  "1-2": "Kaaj goe gedaan bro, ge moogt trots zijn op uweigen. Jammer van die nipte tweede plek met chinese fucking, maar toch een verdienstelijk resultaat! Keep it going en tot de volgendeuuuh",
  "1-3": "Ferm bro, knap da ge de challenges hebt gewonnen, maar het feit da gij zo slecht zijt in chinees poepen, maakt alles wa minder rozegeur en maneschijn he vriend. Ga maar nr China op poepkamp tegen volgend jaar, sneu manneke",
  "1-4": "Challenge koning, maar in plaats van zelf Chinees te poepen, bent gij langs achter geneukt geweest door rest... Get well soon strijder!",
  "2-1": "Chinese Fucking baas! Ge weet hoe te poepen, da's zeker. De challenges hingen net buiten bereik maar uw fokhok-game was godgelijk. Respect kameraad.",
  "2-2": "Tweede in alles. Nie genoeg voor de overwinning maar ook nie slecht genoeg om echt uitgelachen te worden. Gij zijt de Wout Van Aert van Tenerife. Droogt uw tranen, en op naar volgend jaar!",
  "2-3": "Challenges niet slecht, maar Chinese Fucking... da was duidelijk minder uw ding he. Iemand moest derde worden, en gij waart sportief genoeg om die rol op te nemen, merci daarvoor kameraad",
  "2-4": "Challenges goed gedaan, dikke chapeau daarvoor! Maar Chinese Fucking, serieus? Laatste? Ge zou u eigen moeten schamen, trekt echt op niks. Maar bon, fijn dat ge derbij waart i guess...",
  "3-1": "Chinese Fucking heer en meester, maar de challenges waren nie goe genoeg voor meneer ze. Hoe kunde da nu zo slecht doen? Maja, zolang da ge zelf tevreden zijt ist goe he kameraad. Bye byeeee",
  "3-2": "Nergens echt slecht, nergens echt goed. Gij zijt de definitie van erbij zijn. Maar da deed ge keurig en da telt ook mee hé. Salut en tot de volgende keer!",
  "3-3": "Twee keer derde... da's toch een beetje sneu he. Ge waart gelukkig niet de slechtste, maar ge zijt dus ook nergens goe in... See you next year, hopelijk met wat meer inzet van uwentwege!",
  "3-4": "Challenges al niet super, maar dan ook nog eens laatste bij Chinese Fucking? Da is een dubbel verlies kameraad. Maar goe, ge zult uw best wel hebben gedaan, volgend jaar nieuwe kansen!",
  "4-1": "Hoe jammer is dees? Koning Chinese Fucking, maar dan niks bakken van die challenges? Uw mama gaat nie trots zijn op uw ze kameraad. Maar goe, merci om erbij te zijn en tot de volgende",
  "4-2": "Ja jom... die opdrachtjes waren nie uw ding precies he... Chance da ge uw eer nog een beetje hebt gered met goe te poepen. Blijven oefenen, see you next year!",
  "4-3": "Hadde nie beter thuisgebleven? 3e me chinees poepen oke, niveau lag hoog, maar echt zo slecht bij de challenges, triestig gevalleke... ",
  "4-4": "Man man man, hoe slecht zedde gij eigenlijk? Bij alles stade achteraan, hoe triestig is dees... Hopelijk volgend jaar beter zeker... ",
};

function getEndMessage(challengeRank: number, cfRank: number): string {
  const cr = Math.min(challengeRank, 4);
  const cfr = Math.min(cfRank, 4);
  return END_MESSAGES[`${cr}-${cfr}`] ?? "Wa ne reis! Check de scores voor alle details.";
}

type PodiumPlayer = { name: string; avatar_url: string | null; emoji: string; total_points: number };

function PodiumStage({ players, accentColor }: { players: PodiumPlayer[]; accentColor: "amber" | "red" }) {
  const [p1, p2, p3, p4] = players;
  const isRed = accentColor === "red";
  return (
    <>
      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-5">
        {/* 2nd */}
        {p2 && (
          <div className="flex flex-col items-center">
            {p2.avatar_url ? (
              <img src={p2.avatar_url} alt="" className="mb-1.5 h-14 w-14 rounded-full object-cover ring-2 ring-slate-400/60" />
            ) : (
              <div className="mb-1.5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-2xl ring-2 ring-slate-400/40">{p2.emoji}</div>
            )}
            <p className="mb-0.5 max-w-[72px] truncate text-center text-xs font-bold text-slate-300">{p2.name}</p>
            <p className="mb-1 text-[10px] text-slate-400">{p2.total_points}pt</p>
            <div className="flex h-16 w-20 items-center justify-center rounded-t-xl border border-slate-500/30 bg-gradient-to-b from-slate-400/20 to-slate-600/10">
              <span className="text-2xl">🥈</span>
            </div>
          </div>
        )}
        {/* 1st */}
        {p1 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-1.5">
              <div className={`absolute -inset-3 rounded-full blur-xl ${isRed ? "bg-red-500/20" : "bg-amber-500/20"}`} />
              <div className={`relative rounded-full p-[2px] shadow-lg ${isRed ? "bg-gradient-to-br from-red-400 via-orange-300 to-red-600 shadow-red-500/30" : "bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 shadow-amber-500/30"}`}>
                {p1.avatar_url ? (
                  <img src={p1.avatar_url} alt="" className="h-[72px] w-[72px] rounded-full object-cover" />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 text-3xl">{p1.emoji}</div>
                )}
              </div>
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl" style={{ filter: `drop-shadow(0 0 6px ${isRed ? "rgba(239,68,68,0.9)" : "rgba(245,158,11,0.9)"})` }}>
                {isRed ? "💩" : "👑"}
              </span>
            </div>
            <p className="mb-0.5 max-w-[80px] truncate text-center text-sm font-black text-white">{p1.name}</p>
            <p className={`mb-1 text-[10px] font-bold ${isRed ? "text-red-400" : "text-amber-400"}`}>{p1.total_points}pt</p>
            <div className={`flex h-24 w-24 items-center justify-center rounded-t-xl border shadow-lg ${isRed ? "border-red-500/40 bg-gradient-to-b from-red-500/25 to-red-700/10 shadow-red-500/10" : "border-amber-500/40 bg-gradient-to-b from-amber-500/25 to-amber-700/10 shadow-amber-500/10"}`}>
              <span className="text-3xl">🥇</span>
            </div>
          </div>
        )}
        {/* 3rd */}
        {p3 && (
          <div className="flex flex-col items-center">
            {p3.avatar_url ? (
              <img src={p3.avatar_url} alt="" className="mb-1.5 h-12 w-12 rounded-full object-cover ring-2 ring-orange-700/50" />
            ) : (
              <div className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-xl ring-2 ring-orange-700/30">{p3.emoji}</div>
            )}
            <p className="mb-0.5 max-w-[64px] truncate text-center text-xs font-bold text-orange-400">{p3.name}</p>
            <p className="mb-1 text-[10px] text-gray-500">{p3.total_points}pt</p>
            <div className="flex h-10 w-20 items-center justify-center rounded-t-xl border border-orange-700/30 bg-gradient-to-b from-orange-700/20 to-orange-900/5">
              <span className="text-xl">🥉</span>
            </div>
          </div>
        )}
      </div>

      {/* Ground line */}
      <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-slate-600/60 to-transparent" />

      {/* Loser */}
      {p4 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-900/30 bg-red-900/10 px-4 py-3">
          {p4.avatar_url ? (
            <img src={p4.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover opacity-60" />
          ) : (
            <span className="text-2xl opacity-60">{p4.emoji}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-400">{p4.name}</p>
            <p className="text-xs text-red-400">💀 {isRed ? "Vandeeg gepoept" : "Sukkeleir"} · {p4.total_points}pt</p>
          </div>
        </div>
      )}
    </>
  );
}

function PodiumModal({
  challengePlayers,
  cfPlayers,
  onClose,
}: {
  challengePlayers: PodiumPlayer[];
  cfPlayers: PodiumPlayer[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"challenge" | "cf">("challenge");
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-slate-900 pb-10 pt-5 px-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-700" />

        <p className="mb-4 text-center text-2xl font-black text-white">🏆 Eindklassement</p>

        {/* Tabs */}
        <div className="mb-6 flex gap-1.5 rounded-xl bg-slate-800 p-1">
          <button
            onClick={() => setTab("challenge")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === "challenge" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-gray-200"}`}
          >
            🎯 Challenges
          </button>
          <button
            onClick={() => setTab("cf")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === "cf" ? "bg-red-500 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}
          >
            👲 Chinese Fucking
          </button>
        </div>

        {tab === "challenge" && <PodiumStage players={challengePlayers} accentColor="amber" />}
        {tab === "cf" && <PodiumStage players={cfPlayers} accentColor="red" />}

        {/* Actions */}
        <Link
          href="/scoreboard"
          onClick={onClose}
          className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-black shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 active:scale-95"
        >
          Volledig klassement
        </Link>
        <button
          onClick={onClose}
          className="w-full rounded-2xl py-3 text-sm font-medium text-gray-500 transition hover:text-gray-300"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}

function EndScreen({
  user,
  endStats,
  podiumPlayers,
  cfPodiumPlayers,
}: {
  user: User;
  endStats?: { challengeRank: number; cfRank: number; totalPlayers: number };
  podiumPlayers?: PodiumPlayer[];
  cfPodiumPlayers?: PodiumPlayer[];
}) {
  const [showPodium, setShowPodium] = useState(false);
  const msg = endStats ? getEndMessage(endStats.challengeRank, endStats.cfRank) : null;

  return (
    <div className="flex min-h-[calc(100dvh-140px)] flex-col items-center justify-start pt-2">
      {/* Glow backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/4 bottom-1/3 h-64 w-64 rounded-full bg-orange-600/8 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-yellow-300/8 blur-2xl" />
      </div>

      {/* Minimal top-right logout */}
      <div className="mb-4 flex w-full justify-end">
        <form action={logout}>
          <button className="rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-gray-500 transition hover:bg-slate-700 hover:text-gray-300" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>

      {/* Hero — avatar + title */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          {/* Multi-layer glow */}
          <div className="absolute -inset-4 rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 blur-lg" />
          {/* Gold border ring */}
          <div className="relative rounded-full p-[3px] bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 shadow-2xl shadow-amber-500/40">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-6xl">
                {user.emoji || "🎮"}
              </div>
            )}
          </div>
        </div>

        <h2
          className="text-4xl font-black tracking-tight text-white"
          style={{ textShadow: "0 0 40px rgba(245,158,11,0.5)" }}
        >
          't Zit erop, {user.name}!
        </h2>
        <p className="mt-1.5 text-xs font-bold text-amber-400/60 tracking-[0.25em] uppercase">Tenerife 2026</p>
      </div>

      {/* Survivor trophy — for everyone */}
      <div className="mb-5 w-full overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-slate-800/80 to-slate-900/80 px-4 py-5 text-center shadow-xl backdrop-blur">
        <div className="relative inline-block">
          <span className="text-6xl" style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.8))" }}>🏆</span>
          <div className="absolute -inset-4 -z-10 rounded-full bg-amber-500/20 blur-xl" />
        </div>
        <p className="mt-3 text-base font-extrabold text-white tracking-tight">Tenerife 2026 Survivor</p>
        <p className="mt-0.5 text-xs text-amber-400/60">Proficiat! Ge hebt het allemaal overleefd makkerke</p>
      </div>

      {/* Rank badges */}
      {endStats && (
        <div className="mb-4 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-slate-800/60 px-3 py-4 text-center shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">🎯 Challenges</p>
            <p className="mt-2 text-4xl font-black text-white">{rankEmoji(endStats.challengeRank)}</p>
            <p className="mt-1 text-xl font-black text-white">#{endStats.challengeRank}</p>
            <p className="text-[10px] text-gray-500">van {endStats.totalPlayers}</p>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-gradient-to-b from-red-500/10 to-slate-800/60 px-3 py-4 text-center shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/60">👲 Chinese Fucking</p>
            <p className="mt-2 text-4xl font-black text-white">{rankEmoji(endStats.cfRank)}</p>
            <p className="mt-1 text-xl font-black text-white">#{endStats.cfRank}</p>
            <p className="text-[10px] text-gray-500">van {endStats.totalPlayers}</p>
          </div>
        </div>
      )}

      {/* Personal verdict */}
      {msg && (
        <div className="mb-5 w-full rounded-2xl border border-amber-500/15 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 shadow-xl backdrop-blur">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/70">⚡ Uw eindverdict</p>
          <p className="text-sm leading-relaxed text-gray-100">{msg}</p>
        </div>
      )}

      {/* Podium modal */}
      {showPodium && (
        <PodiumModal
          challengePlayers={podiumPlayers ?? []}
          cfPlayers={cfPodiumPlayers ?? []}
          onClose={() => setShowPodium(false)}
        />
      )}

      {/* CTA buttons */}
      <div className="w-full space-y-2.5">
        <button
          onClick={() => setShowPodium(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-base font-extrabold text-black shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 active:scale-95"
        >
          🏆 Eindklassement
        </button>
        <Link
          href="/gallery"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-600/80 bg-slate-800/80 py-3.5 text-base font-bold text-white transition hover:bg-slate-700 active:scale-95"
        >
          📸 Foto&apos;s terugkijken
        </Link>
      </div>
    </div>
  );
}

export default function DashboardClient({
  user,
  assignments: initial,
  pendingConfirmations: initialPending,
  recentConfirmed: initialRecentConfirmed,
  players: initialPlayers,
  endStats,
  podiumPlayers,
  cfPodiumPlayers,
  challengeCounts,
  cfSessions,
}: {
  user: User;
  assignments: Assignment[];
  pendingConfirmations: PendingConfirmation[];
  recentConfirmed?: PendingConfirmation[];
  players: { name: string; emoji: string; avatar_url: string | null }[];
  endStats?: { challengeRank: number; cfRank: number; totalPlayers: number };
  podiumPlayers?: PodiumPlayer[];
  cfPodiumPlayers?: PodiumPlayer[];
  challengeCounts?: { name: string; count: number }[];
  cfSessions: { id: string; day: number; scores: Record<string, number> }[];
}) {
  const [assignments, setAssignments] = useState(initial);
  const [pending, setPending] = useState(initialPending);
  const [players, setPlayers] = useState(initialPlayers);
  const [loading, setLoading] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [emojiInput, setEmojiInput] = useState(user.emoji || "");
  const [uploading, setUploading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ name: string; url: string } | null>(null);
  const [challengeCollapsed, setChallengeCollapsed] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: "complete"; id: string; title: string; hasBonus?: boolean; bonusDesc?: string; bonusPoints?: number } | null>(null);
  const [bonusSelected, setBonusSelected] = useState(false);
  const [undoAction, setUndoAction] = useState<{ id: string; title: string } | null>(null);
  const [historyTab, setHistoryTab] = useState<"challenges" | "cf" | "approvals">("challenges");
  const [challengeTab, setChallengeTab] = useState<"doe" | "gotcha">("doe");
  const [showRevealAnim, setShowRevealAnim] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [nextDayCountdown, setNextDayCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<PendingConfirmation[]>(initialRecentConfirmed || []);
  const [showMenu, setShowMenu] = useState(false);
  const [cfDayFilter, setCfDayFilter] = useState<number | "all">("all");

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

  useEffect(() => {
    function updateReset() {
      const resetTime = getNextResetTime();
      const diff = Math.max(0, resetTime.getTime() - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setNextDayCountdown({ hours, minutes, seconds });

      // When countdown hits zero, expire active challenges client-side
      if (diff === 0) {
        setAssignments((prev) =>
          prev.map((a) =>
            a.status === "active" ? { ...a, status: "expired" as const } : a
          )
        );
      }
    }
    updateReset();
    const interval = setInterval(updateReset, 1000);
    return () => clearInterval(interval);
  }, []);

  const active = assignments.filter((a) => a.status === "active");
  const pendingOwn = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => a.status === "completed");
  const skipped = assignments.filter((a) => a.status === "skipped");
  const expired = assignments.filter((a) => a.status === "expired");
  const todayCount = currentDay ? assignments.filter((a) => a.day === currentDay).length : 0;
  const dailyLimitReached = todayCount >= 2;

  async function handleComplete(id: string, bonusCompleted: boolean = false) {
    setLoading(id);
    const res = await completeChallenge(id, bonusCompleted);
    if (!("error" in res)) {
      const newStatus = user.name === "Anton" ? "completed" : "pending";
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: newStatus as "completed" | "pending", bonus_completed: bonusCompleted } : a
        )
      );
    }
    setLoading(null);
  }

  async function handleRequestNew() {
    const day = currentDay || 1;
    setLoading("new");
    const result = await requestNewChallenge(day);
    if (result && "error" in result) {
      alert(result.error);
      setLoading(null);
      return;
    }
    // Refetch assignments client-side so modal can show the new challenges
    const sb = createBrowserClient();
    const assignmentsTable = getTable("assignments");
    const challengesTable = getTable("challenges");
    const { data: freshAssignments } = await sb
      .from(assignmentsTable)
      .select(`*, ${challengesTable}(*, categories(*))`)
      .eq("user_id", user.id)
      .order("day", { ascending: true });
    if (freshAssignments) {
      // Normalize nested challenge key
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = freshAssignments.map((a: any) => {
        const challenges = a.challenges || a.challenges_test || null;
        return { ...a, challenges };
      });
      setAssignments(normalized);
    }
    setLoading(null);
    // Show the drawing animation, then reveal modal after it finishes
    setShowRevealAnim(true);
  }

  function handleRevealAnimComplete() {
    setShowRevealAnim(false);
    setShowRevealModal(true);
  }

  function handleCloseReveal() {
    setShowRevealModal(false);
  }

  async function handleConfirm(id: string) {
    setLoading(id);
    const confirmed = pending.find((p) => p.id === id);
    const res = await confirmChallenge(id);
    if (!("error" in res)) {
      setPending((prev) => prev.filter((p) => p.id !== id));
      if (confirmed) setRecentlyConfirmed((prev) => [confirmed, ...prev]);
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
      setRecentlyConfirmed((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error);
    }
    setLoading(null);
  }

  async function handleUndo(id: string) {
    setLoading(id);
    const res = await undoConfirmChallenge(id);
    if (!("error" in res)) {
      setAssignments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: "active" as const, bonus_completed: false } : a)
      );
      // If it was a recently confirmed other player's challenge, move it back to pending
      const wasRecent = recentlyConfirmed.find((r) => r.id === id);
      if (wasRecent) {
        setRecentlyConfirmed((prev) => prev.filter((r) => r.id !== id));
        setPending((prev) => [wasRecent, ...prev]);
      }
    } else if ("error" in res) {
      alert(res.error);
    }
    setLoading(null);
    setUndoAction(null);
  }

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

  // Ban screen for specific users
  const BANNED_USERS = ["Berten", "Lander"];
  if (BANNED_USERS.includes(user.name)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-950 via-slate-950 to-black p-6 text-center">
        <div className="animate-pulse text-8xl mb-6">🚫</div>
        <h1 className="text-4xl font-black text-red-500 mb-3">U werd geblokkeerd</h1>
        <p className="text-xl font-bold text-white mb-2">Gij hebt 100 ze</p>
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4">
          <p className="text-sm text-red-300/80">Contacteer de admin als ge denkt dat dit een fout is.</p>
          <p className="mt-1 text-xs text-red-400/50">(Het is geen fout, was bewust)</p>
        </div>
        <form action={logout} className="mt-8">
          <button className="rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-gray-400 hover:bg-slate-700">
            Logout
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      {gameStatus === "active" && <RandomImage />}
      <div className="relative z-10 mx-auto max-w-lg">
        {/* Header / Profile — hidden on end screen */}
        {gameStatus !== "after" && (
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
                  ? `Dag ${currentDay} · ${completed.length} challenges volbracht...`
                  : gameStatus === "active"
                  ? "Game is live! 🎉"
                  : "Countdown loopt..."}
              </p>
            </div>

            {/* Action buttons — compact menu */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              {gameStatus === "active" && (
                <Link
                  href="/scoreboard"
                  className="rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-slate-700"
                >
                  🏆
                </Link>
              )}
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="relative rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-gray-400 transition hover:bg-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
                {user.name === "Anton" && pending.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                    {pending.length}
                  </span>
                )}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-xl border border-slate-700/50 bg-slate-800/95 p-1.5 shadow-xl backdrop-blur">
                    {(completed.length > 0 || skipped.length > 0 || expired.length > 0 || (user.name === "Anton" && gameStatus === "active")) && (
                      <button
                        onClick={() => { setShowMenu(false); setShowHistory(true); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                      >
                        <span>Mijn Prestaases</span>
                        {user.name === "Anton" && pending.length > 0 && (
                          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                            {pending.length}
                          </span>
                        )}
                      </button>
                    )}
                    {gameStatus === "active" && (
                      <Link
                        href="/gallery"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                      >
                        <span>'t Galerieke</span>
                      </Link>
                    )}
                    <form action={logout}>
                      <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-slate-700">
                        <span>Juuuuuw</span>
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Day tracker inside profile card */}
          {gameStatus === "active" && currentDay && (
            <div className="mt-2.5">
              <DayTracker day={currentDay} />
            </div>
          )}
        </div>
        )}

        {/* Before game */}
        {gameStatus === "before" && (
          <div className="flex flex-col items-center justify-between min-h-[calc(100dvh-120px)] py-2">
            {/* Hero */}
            <div className="text-center">
              <p className="text-7xl animate-bounce" style={{ animationDuration: "3s" }}>🏝️</p>
              <h2 className="mt-2 text-5xl font-black tracking-tight text-white" style={{ textShadow: "0 0 40px rgba(245, 158, 11, 0.4), 0 0 80px rgba(245, 158, 11, 0.1)" }}>
                TENERIFE
              </h2>
              <p className="text-2xl font-black text-amber-400" style={{ textShadow: "0 0 20px rgba(245, 158, 11, 0.3)" }}>2026</p>
              <p className="mt-1 text-xs italic font-medium tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent animate-pulse" style={{ animationDuration: "4s" }}>
                &ldquo;Maximaal vruuten, zuipen en vapen&rdquo;
              </p>
            </div>

            {/* Countdown */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-800/80 to-slate-900/80 px-4 py-4 text-center shadow-xl shadow-amber-500/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/60">⏳ Countdown</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
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
                    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-500">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>🛫 12 mei</span>
                <span className="text-amber-400">→</span>
                <span>🛬 19 mei</span>
              </div>
            </div>

            {/* Flight change notice */}
            <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/5 px-3 py-3">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">✈️</span>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Vlucht update - dood aan alle socialisten!</p>
                  <p className="mt-0.5 text-[10px] text-gray-300 leading-relaxed">
                    Die stoeme vakbonden moeten zich altijd aanstellen he, vlucht gecanceld. 
                    We vliegen nu via Eindhoven (aankomst 22:55). 
                    Maakt nie uit rekels, Guido&apos;s Fokhok wacht nog altijd op ons. Een dik uur voor dat we opstijgen, zal de countdown die 0 hitten, en volgt er meer informatie
                    <br />
                    <br />
                    Sending all the love, Guido & Anton
                  </p>
                </div>
              </div>
            </div>

            {/* Crew */}
            <div className="w-full pb-4">
              <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">✈️ Crew</p>
              <div className="grid w-full grid-cols-4 gap-2">
                {players.map((player) => (
                  <div
                    key={player.name}
                    className={`rounded-xl border px-2 py-2.5 flex flex-col items-center justify-center text-center gap-1 transition-all duration-300 hover:scale-105 ${
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

            {/* Challenge counts (test-only, Anton-only) */}
            {challengeCounts && (
              <div className="w-full rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">🧪 Challenges in DB</p>
                <div className="flex items-center gap-3">
                  {challengeCounts.map((c) => (
                    <span key={c.name} className="text-[11px] text-gray-300">
                      {c.name}: <span className="font-bold text-amber-400">{c.count}</span>
                    </span>
                  ))}
                  <span className="text-[11px] text-gray-500 ml-auto">
                    Σ {challengeCounts.reduce((sum, c) => sum + c.count, 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game ended */}
        {gameStatus === "after" && (
          <EndScreen user={user} endStats={endStats} podiumPlayers={podiumPlayers} cfPodiumPlayers={cfPodiumPlayers} />
        )}

        {/* Day 1 welcome — rendered as overlay below */}

        {/* During game - challenges available */}
        {gameStatus === "active" && currentDay && challengesAvailable() && (
          <>
            {/* Active Challenges - rendered in bottom bar outside this container */}
          </>
        )}

        {/* History modal */}
        {showHistory && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
            <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-4">
                <p className="text-base font-extrabold text-white">Mijn rapportje</p>
                <button onClick={() => setShowHistory(false)} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-gray-400 hover:text-white">✕ Sluiten</button>
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-1 border-b border-slate-700/60 px-4 py-2">
                <button
                  onClick={() => setHistoryTab("challenges")}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    historyTab === "challenges" ? "bg-slate-700 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Challenges
                </button>
                <button
                  onClick={() => setHistoryTab("cf")}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    historyTab === "cf" ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Chinese Fucking
                </button>
                {user.name === "Anton" && gameStatus === "active" && (
                  <button
                    onClick={() => setHistoryTab("approvals")}
                    className={`relative rounded-lg px-3 py-2 text-xs font-bold transition ${
                      historyTab === "approvals" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Goedkeuring
                    {pending.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                        {pending.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Challenges tab */}
                {historyTab === "challenges" && (
                  <>
                    {completed.length === 0 && skipped.length === 0 && expired.length === 0 && (
                      <p className="py-8 text-center text-sm text-gray-500">Nog geen challenges gedaan of geskipt.</p>
                    )}
                    {completed.length > 0 && (
                      <div className="mb-4">
                        <h2 className="mb-2 text-sm font-bold text-emerald-400">Been there, done that (slay queen) ({completed.length})</h2>
                        <div className="space-y-1.5">
                          {completed.map((a) => (
                            <div key={a.id} className="rounded-lg bg-emerald-500/10 px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-xs text-emerald-300">Dag {a.day}</span>
                                  <p className="text-sm font-medium text-white">{a.challenges?.title}</p>
                                  {a.challenges?.created_by_admin && <p className="text-[10px] text-gray-500">Bedacht door: {a.challenges.created_by_admin}</p>}
                                </div>
                                <div className="flex shrink-0 items-center gap-1 pt-0.5">
                                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-bold text-emerald-400">+{a.challenges?.points}pts</span>
                                  {a.bonus_completed && a.challenges?.bonus_points ? <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs font-bold text-yellow-400">+{a.challenges.bonus_points} 🌟</span> : null}
                                  {user.name === "Anton" && (
                                    <button
                                      onClick={() => setUndoAction({ id: a.id, title: a.challenges?.title || "Unknown" })}
                                      className="ml-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 transition hover:bg-red-500/30"
                                    >
                                      ↩
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {skipped.length > 0 && (
                      <div>
                        <h2 className="mb-2 text-sm font-bold text-red-400">Ik was beetje pussy voor deze ({skipped.length})</h2>
                        <div className="space-y-1.5">
                          {skipped.map((a) => (
                            <div key={a.id} className="rounded-lg bg-red-500/10 px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-xs text-red-300">Dag {a.day}</span>
                                  <p className="text-sm font-medium text-white/50 line-through">{a.challenges?.title}</p>
                                  {a.challenges?.created_by_admin && <p className="text-[10px] text-gray-600">Bedacht door: {a.challenges.created_by_admin}</p>}
                                </div>
                                <span className="shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-bold text-red-400">-10pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {expired.length > 0 && (
                      <div className="mt-4">
                        <h2 className="mb-2 text-sm font-bold text-gray-500">Te laat bro (geen minpunten, enkel min aura) ({expired.length})</h2>
                        <div className="space-y-1.5">
                          {expired.map((a) => (
                            <div key={a.id} className="rounded-lg bg-slate-700/30 px-3 py-2">
                              <span className="text-xs text-gray-500">Dag {a.day} · -5pts</span>
                              <p className="text-sm font-medium text-white/40">{a.challenges?.title}</p>
                              {a.challenges?.created_by_admin && <p className="text-[10px] text-gray-600">Bedacht door: {a.challenges.created_by_admin}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Chinese Fucking tab */}
                {historyTab === "cf" && (
                  <div>
                    {cfSessions.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">Nog geen sessies gespeeld</p>
                    ) : (
                      <>
                        {/* Summary + filter row */}
                        <div className="flex items-center justify-between mb-4">
                          {(() => {
                            const myTotal = cfSessions.reduce((sum, s) => sum + (s.scores[user.name] || 0), 0);
                            const myWins = cfSessions.filter((s) => {
                              const max = Math.max(...Object.values(s.scores));
                              const winners = Object.entries(s.scores).filter(([, v]) => v === max);
                              return winners.length === 1 && winners[0][0] === user.name;
                            }).length;
                            return (
                              <p className="text-[11px] text-gray-500">
                                <span className="font-bold text-red-400">{myTotal}</span> pts · <span className="font-bold text-amber-400">{myWins}</span> wins
                              </p>
                            );
                          })()}
                          <div className="flex gap-1">
                            <button
                              onClick={() => setCfDayFilter("all")}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition ${cfDayFilter === "all" ? "bg-red-500/20 text-red-400" : "text-gray-600"}`}
                            >
                              All
                            </button>
                            {[...new Set(cfSessions.map((s) => s.day))].sort().map((d) => (
                              <button
                                key={d}
                                onClick={() => setCfDayFilter(d)}
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition ${cfDayFilter === d ? "bg-red-500/20 text-red-400" : "text-gray-600"}`}
                              >
                                D{d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sessions */}
                        {(() => {
                          const filtered = [...cfSessions].filter((s) => cfDayFilter === "all" || s.day === cfDayFilter).reverse();
                          return (
                            <div className="space-y-3">
                              {filtered.map((session, idx) => {
                                const scores = session.scores || {};
                                const maxPts = Math.max(...Object.values(scores), 0);
                                const winners = Object.entries(scores).filter(([, v]) => v === maxPts && maxPts > 0);
                                const winner = winners.length === 1 ? winners[0][0] : null;
                                return (
                                  <div key={session.id} className="rounded-lg bg-slate-800/30 px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[9px] text-gray-600">Dag {session.day} · #{filtered.length - idx}</span>
                                      {winner && <span className="text-[9px] text-amber-400/80">👑 {winner}</span>}
                                    </div>
                                    <div className="flex gap-1.5">
                                      {Object.entries(scores).sort(([, a], [, b]) => b - a).map(([name, pts]) => (
                                        <div
                                          key={name}
                                          className={`flex-1 rounded py-1 text-center ${
                                            name === user.name
                                              ? "bg-red-500/10 ring-1 ring-red-500/30"
                                              : "bg-slate-700/20"
                                          }`}
                                        >
                                          <p className={`text-[9px] truncate ${name === user.name ? "text-red-300" : "text-gray-600"}`}>{name}</p>
                                          <p className={`text-xs font-bold ${name === user.name ? "text-red-400" : winner === name ? "text-amber-400" : "text-gray-400"}`}>{pts}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Approvals tab (Anton only) */}
                {user.name === "Anton" && historyTab === "approvals" && (
                  <div className="space-y-3">
                    {pending.length === 0 && recentlyConfirmed.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">Niemand wacht op goedkeuring — top!</p>
                    ) : (
                      <>
                        {pending.map((p) => (
                          <div key={p.id} className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-slate-800/80 p-4 shadow-lg">
                            <div className="mb-3 flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-lg">👤</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-amber-300">{p.users?.name} zegt: gedaan!</p>
                                <p className="mt-0.5 font-bold text-white leading-snug">{p.challenges?.title}</p>
                                {p.challenges?.description && (
                                  <p className="mt-0.5 text-xs text-gray-400 leading-snug">{p.challenges.description}</p>
                                )}
                                {p.bonus_completed && p.challenges?.bonus_points != null && p.challenges.bonus_points > 0 && (
                                  <p className="mt-1 text-xs font-bold text-yellow-400">🌟 Bonus geclaimd (+{p.challenges.bonus_points}pts)</p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-bold text-amber-400">+{p.challenges?.points}pts</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirm(p.id)}
                                disabled={loading === p.id}
                                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                              >
                                Alleej dan
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                disabled={loading === p.id}
                                className="flex-1 rounded-xl border border-red-500/30 bg-red-900/30 py-2.5 text-sm font-extrabold text-red-400 transition hover:bg-red-900/50 active:scale-95 disabled:opacity-50"
                              >
                                Niejet jom
                              </button>
                            </div>
                          </div>
                        ))}
                        {recentlyConfirmed.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent bevestigd</p>
                            {recentlyConfirmed.map((r) => (
                              <div key={r.id} className="mb-2 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-emerald-300">{r.users?.name}</p>
                                  <p className="text-sm font-medium text-white truncate">{r.challenges?.title}</p>
                                </div>
                                <button
                                  onClick={() => handleUndo(r.id)}
                                  disabled={loading === r.id}
                                  className="ml-2 shrink-0 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-400 transition hover:bg-red-500/30 active:scale-95 disabled:opacity-50"
                                >
                                  ↩ Undo
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-6" onClick={() => { setConfirmAction(null); setBonusSelected(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-center text-3xl">✅</p>
            <p className="mt-2 text-center text-lg font-extrabold text-white">Challenge kleir?</p>
            <p className="mt-1 text-center text-sm text-gray-400">&ldquo;{confirmAction.title}&rdquo;</p>
            <p className="mt-1 text-center text-xs text-emerald-400">Anton gaat da toch nog ff moeten bevestigen, dan krijgde uw puntjes x</p>
            {confirmAction.hasBonus && confirmAction.bonusDesc && (
              <button
                type="button"
                onClick={() => setBonusSelected(!bonusSelected)}
                className={`mt-3 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  bonusSelected
                    ? "border-yellow-500 bg-yellow-500/15 text-yellow-300"
                    : "border-slate-600 bg-slate-800 text-gray-400"
                }`}
              >
                <span>{bonusSelected ? "✅" : "⬜"}</span>
                <span>🌟 Bonus ook gedaan? (+{confirmAction.bonusPoints}pts)</span>
              </button>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setConfirmAction(null); setBonusSelected(false); }} className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-gray-300 transition hover:bg-slate-600 active:scale-95">Annuleer</button>
              <button
                onClick={() => { handleComplete(confirmAction.id, bonusSelected); setConfirmAction(null); setBonusSelected(false); }}
                disabled={loading === confirmAction.id}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
              >
                Sjeker da!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo confirmation modal */}
      {undoAction && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-6" onClick={() => setUndoAction(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-center text-3xl">↩️</p>
            <p className="mt-2 text-center text-lg font-extrabold text-white">Undo goedkeuring?</p>
            <p className="mt-1 text-center text-sm text-gray-400">&ldquo;{undoAction.title}&rdquo;</p>
            <p className="mt-2 text-center text-xs text-amber-400">Challenge wordt teruggezet naar actief bij die speler.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setUndoAction(null)} className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-gray-300 transition hover:bg-slate-600 active:scale-95">Annuleer</button>
              <button
                onClick={() => handleUndo(undoAction.id)}
                disabled={loading === undoAction.id}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-900/50 py-3 text-sm font-extrabold text-red-300 transition hover:bg-red-900/70 active:scale-95 disabled:opacity-50"
              >
                Ja, undo!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar - active challenges */}
      {gameStatus === "active" && currentDay && challengesAvailable() && (
        <>
          {active.length === 0 && pendingOwn.length === 0 ? (
            <div
              className="bg-slate-950/98 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
              style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, borderTop: "1px solid rgba(245,158,11,0.15)", borderRadius: "20px 20px 0 0" }}
            >
              <div className="mx-auto max-w-lg">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-amber-400/70">⚡ Mijn challenges</p>
                {dailyLimitReached ? (
                  <div className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-4 text-center">
                    <p className="text-sm font-bold text-gray-300">Good boy, alles al gedaan, morgen moogder weer invliegen</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Nieuwe challenges morgen over{" "}
                      <span className="font-bold text-amber-400">
                        {String(nextDayCountdown.hours).padStart(2, "0")}:{String(nextDayCountdown.minutes).padStart(2, "0")}:{String(nextDayCountdown.seconds).padStart(2, "0")}
                      </span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestNew}
                    disabled={loading === "new"}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-base font-extrabold text-black shadow-lg shadow-amber-500/30 transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-50"
                  >
                    {loading === "new" ? "Laden..." : "Trek nieuwe challenges voor vandaag"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
              {/* Peek strip */}
              <button
                className="w-full border-t border-amber-500/20 bg-slate-950/98 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md"
                onClick={() => setChallengeCollapsed((c) => !c)}
              >
                <div className="mx-auto max-w-lg">
                  {challengeCollapsed ? (
                    <>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400/80">⚡ Mijn challenges</span>
                        <span className="text-[10px] text-gray-600">▼</span>
                      </div>
                      {active.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-lg bg-teal-900/50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-300">Doe</span>
                          <span className="shrink-0 rounded-lg bg-amber-900/50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-300">Gotcha</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-gray-400">{active.length} actief</span>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-amber-400">⏳ Wachten op bevestiging</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400/80">⚡ Mijn challenges</span>
                      <span className="text-[10px] text-gray-600">▲</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded panel with tabs */}
              {!challengeCollapsed && (
                <div className="bg-slate-950/98 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md">
                  <div className="mx-auto max-w-lg">
                    {/* Tab toggle */}
                    {active.length > 0 && (
                      <div className="mb-3 flex rounded-xl border border-slate-700 bg-slate-800/60 p-0.5">
                        <button
                          onClick={() => setChallengeTab("doe")}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${challengeTab === "doe" ? "bg-teal-500/20 text-teal-300 shadow" : "text-gray-500"}`}
                        >
                          Doe opdracht
                        </button>
                        <button
                          onClick={() => setChallengeTab("gotcha")}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${challengeTab === "gotcha" ? "bg-amber-500/20 text-amber-300 shadow" : "text-gray-500"}`}
                        >
                          Gotcha
                        </button>
                      </div>
                    )}

                    {/* Active challenge card */}
                    {(() => {
                      const doeChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("doe"));
                      const gotchaChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("gotcha"));
                      const shown = challengeTab === "doe" ? doeChallenge : gotchaChallenge;

                      if (!shown && active.length > 0) {
                        // Fallback: show first active if tab has none
                        const fallback = active[0];
                        return (
                          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 p-4 shadow-xl">
                            <p className="text-sm text-gray-400">Geen {challengeTab === "doe" ? "doe opdracht" : "gotcha"} actief</p>
                          </div>
                        );
                      }

                      if (!shown) return null;

                      return (
                        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 shadow-xl">
                          <div className={`h-1 w-full ${challengeTab === "doe" ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`} />
                          <div className="p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                {challengeTab === "gotcha" ? (
                                  <>
                                    <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-amber-400/60">Het woord:</p>
                                    <h3 className="text-3xl font-black leading-tight tracking-tight text-white">{shown.challenges?.title}</h3>
                                  </>
                                ) : (
                                  <h3 className="text-2xl font-black leading-tight tracking-tight text-white">{shown.challenges?.title}</h3>
                                )}
                              </div>
                              <span className="shrink-0 rounded-lg bg-amber-500/15 px-2.5 py-1 text-sm font-extrabold text-amber-400 ring-1 ring-amber-500/30">
                                +{shown.challenges?.points} pts
                              </span>
                            </div>
                            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-slate-700/40 px-2.5 py-1.5">
                              <span className="text-[11px] font-medium text-gray-400">Verloopt over</span>
                              <span className="ml-auto font-mono text-xs font-bold text-amber-400 tabular-nums">
                                {String(nextDayCountdown.hours).padStart(2, "0")}:{String(nextDayCountdown.minutes).padStart(2, "0")}:{String(nextDayCountdown.seconds).padStart(2, "0")}
                              </span>
                              <span className="text-[10px] text-red-400/70 font-medium">(-5pts)</span>
                            </div>
                            {shown.target_player_name && (
                              <div className="mb-2 flex items-center gap-1.5">
                                <span className="text-sm font-bold text-orange-400">Target: {shown.target_player_name}</span>
                              </div>
                            )}
                            {shown.challenges?.description && (
                              <div className="mt-2 max-h-32 overflow-y-auto">
                                <p className="text-sm leading-relaxed text-gray-400">{shown.challenges.description}</p>
                              </div>
                            )}
                            {shown.challenges?.created_by_admin && (
                              <p className="mt-1.5 text-[10px] text-gray-500">Bedacht door: {shown.challenges.created_by_admin}</p>
                            )}
                            {shown.challenges?.bonus_points != null && shown.challenges.bonus_points > 0 && shown.challenges.bonus_description && (
                              <div className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                                <p className="text-xs font-bold text-yellow-400">🌟 Bonus (+{shown.challenges.bonus_points} pts)</p>
                                <p className="text-xs text-yellow-300/70">{shown.challenges.bonus_description}</p>
                              </div>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => setConfirmAction({
                                  type: "complete",
                                  id: shown.id,
                                  title: shown.challenges?.title || "",
                                  hasBonus: (shown.challenges?.bonus_points ?? 0) > 0,
                                  bonusDesc: shown.challenges?.bonus_description ?? undefined,
                                  bonusPoints: shown.challenges?.bonus_points ?? 0,
                                })}
                                disabled={loading === shown.id}
                                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-50"
                              >
                                {loading === shown.id ? "..." : "Kleir!"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Pending challenges */}
                    {pendingOwn.map((a) => (
                      <div key={a.id} className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">⏳</span>
                          <div>
                            <p className="text-xs font-bold text-amber-400">Wachten op bevestiging van Anton</p>
                            <p className="text-sm font-bold text-white">{a.challenges?.title}</p>
                          </div>
                          <span className="ml-auto shrink-0 text-xs font-extrabold text-amber-400">+{a.challenges?.points}pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Drawing animation */}
      {showRevealAnim && <ChallengeReveal onComplete={handleRevealAnimComplete} />}

      {/* Challenge Reveal Modal */}
      {showRevealModal && active.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Tab header */}
            <div className="flex border-b border-slate-700">
              {(() => {
                const doeChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("doe"));
                const gotchaChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("gotcha"));
                return (
                  <>
                    <button
                      onClick={() => setChallengeTab("doe")}
                      className={`flex-1 py-3 text-sm font-bold transition ${challengeTab === "doe" ? "text-teal-400 border-b-2 border-teal-400 bg-teal-500/5" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Doe opdracht
                    </button>
                    <button
                      onClick={() => setChallengeTab("gotcha")}
                      className={`flex-1 py-3 text-sm font-bold transition ${challengeTab === "gotcha" ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Gotcha
                    </button>
                  </>
                );
              })()}
            </div>
            {/* Tab content */}
            <div className="p-5">
              {(() => {
                const doeChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("doe"));
                const gotchaChallenge = active.find(a => a.challenges?.categories?.name?.toLowerCase().includes("gotcha"));
                const shown = challengeTab === "doe" ? doeChallenge : gotchaChallenge;
                if (!shown) return <p className="text-center text-gray-400 text-sm">Geen challenge gevonden</p>;
                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {challengeTab === "gotcha" ? (
                          <>
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400/70">Het woord:</p>
                            <h3 className="text-3xl font-black leading-tight text-white">{shown.challenges?.title}</h3>
                          </>
                        ) : (
                          <h3 className="text-2xl font-black leading-tight text-white">{shown.challenges?.title}</h3>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg bg-amber-500/15 px-2.5 py-1 text-sm font-extrabold text-amber-400 ring-1 ring-amber-500/30">
                        +{shown.challenges?.points} pts
                      </span>
                    </div>
                    <div className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      shown.challenges?.difficulty === "hard" ? "bg-red-900/50 text-red-300" :
                      shown.challenges?.difficulty === "medium" ? "bg-amber-900/50 text-amber-300" :
                      "bg-emerald-900/50 text-emerald-300"
                    }`}>
                      {shown.challenges?.difficulty}
                    </div>
                    {shown.target_player_name && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-orange-400">Target: {shown.target_player_name}</span>
                      </div>
                    )}
                    {shown.challenges?.description && (
                      <p className="text-sm leading-relaxed text-gray-300">{shown.challenges.description}</p>
                    )}
                    {shown.challenges?.created_by_admin && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-2">
                        <span className="text-base">✍️</span>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Bedacht door</p>
                          <p className="text-sm font-bold text-white">{shown.challenges.created_by_admin}</p>
                        </div>
                      </div>
                    )}
                    {shown.challenges?.bonus_points != null && shown.challenges.bonus_points > 0 && shown.challenges.bonus_description && (
                      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                        <p className="text-xs font-bold text-yellow-400">🌟 Bonus (+{shown.challenges.bonus_points} pts)</p>
                        <p className="text-xs text-yellow-300/70">{shown.challenges.bonus_description}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-700/40 px-2.5 py-1.5">
                      <span className="text-xs">⚠️</span>
                      <span className="text-[11px] font-medium text-red-400/80">Niet gedaan voor 4u 's nachts = -5 punten</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Close button */}
            <div className="border-t border-slate-700 p-4">
              <button
                onClick={handleCloseReveal}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-extrabold text-black transition hover:from-amber-400 hover:to-orange-400 active:scale-95"
              >
                Begrepen, let&apos;s go! 🔥
              </button>
            </div>
          </div>
        </div>
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

      {/* Day 1 welcome overlay */}
      {gameStatus === "active" && currentDay && !challengesAvailable() && showWelcomeOverlay && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowWelcomeOverlay(false)}
              className="absolute right-3 top-3 rounded-lg bg-slate-700/60 px-2.5 py-1 text-xs font-medium text-gray-400 transition hover:bg-slate-700"
            >
              ✕ Sluiten
            </button>
            <p className="mb-3 text-5xl">🏝️</p>
            <h2 className="text-2xl font-black text-white">Dag vrienden! Binnen enkele uurtjes arriveren we in Guido&apos;s fokhok!</h2>
            <p className="mt-2 text-sm font-medium text-gray-300">Let the games begin</p>
            <div className="mt-4 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
              ⏳ Vanaf morgen 9u begint het voor echt...
            </div>
            <button
              onClick={() => setShowWelcomeOverlay(false)}
              className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-extrabold text-black transition hover:bg-amber-400 active:scale-95"
            >
              Let&apos;s go! 🤙
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
