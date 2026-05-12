"use client";

import { useState } from "react";
import { banUser, unbanUser } from "../../actions";
import Link from "next/link";
import { User } from "@/lib/types";

type PlayerRow = { id: string; name: string; is_banned: boolean };

export default function AdminSettingsClient({
  user,
  players: initialPlayers,
}: {
  user: User;
  players: PlayerRow[];
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleToggleBan(player: PlayerRow) {
    setLoading(player.id);
    const action = player.is_banned ? unbanUser : banUser;
    const res = await action(player.id);
    if ("error" in res && res.error) {
      alert(res.error);
    } else {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === player.id ? { ...p, is_banned: !p.is_banned } : p
        )
      );
    }
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            className="rounded-lg bg-slate-700/50 px-3 py-2 text-sm text-gray-400 transition hover:bg-slate-700 hover:text-white"
          >
            ← Terug
          </Link>
          <h1 className="text-xl font-black text-white">⚙️ Admin Settings</h1>
          <div className="w-16" />
        </div>

        {/* Ban Management */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-5 backdrop-blur">
          <h2 className="mb-4 text-lg font-bold text-white">🚫 Spelers bannen</h2>
          <p className="mb-4 text-sm text-gray-400">
            Gebande spelers zien een blokkeer-scherm wanneer ze inloggen.
          </p>

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  player.is_banned
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-slate-700/50 bg-slate-700/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-white">{player.name}</span>
                  {player.is_banned && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">
                      Banned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleBan(player)}
                  disabled={loading === player.id || player.name === "Anton"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                    player.is_banned
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  } ${player.name === "Anton" ? "cursor-not-allowed" : ""}`}
                >
                  {loading === player.id
                    ? "..."
                    : player.is_banned
                    ? "Unban"
                    : "Ban"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
