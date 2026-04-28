"use client";

import { useState, useEffect } from "react";

type EasterEgg = {
  trigger: string;
  response: string;
  emoji?: string;
};

const EASTER_EGGS: EasterEgg[] = [
  { trigger: "Klik hier", response: "Good boy 🐶", emoji: "👆" },
  { trigger: "Niet klikken!", response: "Ge luistert ook nooit eh 🙄", emoji: "🚫" },
  { trigger: "Geheim bericht", response: "Anton is de beste 👑", emoji: "✉️" },
  { trigger: "Druk hier voor gratis bier", response: "Grapjas. Ga zelf halen 🍺", emoji: "🍺" },
  { trigger: "Tik 3x", response: "1x was genoeg sukkelaar 😂", emoji: "👈" },
  { trigger: "Wie wint er?", response: "Nie gij in elk geval 💀", emoji: "🤔" },
  { trigger: "Klik voor wijsheid", response: "Wie nie drinkt, verliest punten. - Confucius", emoji: "🧠" },
  { trigger: "Open mij", response: "Proficiat! Gij hebt niks gewonnen 🎉", emoji: "🎁" },
  { trigger: "Sssst...", response: "DEANSEN WANSEN ERANSEN! 📢", emoji: "🤫" },
  { trigger: "Geluksklik", response: "Ge hebt nu 7 jaar schoonheid... of nie", emoji: "🍀" },
  { trigger: "Knop", response: "Waarvoor dient deze knop eigenlijk? Niemand weet het.", emoji: "🔘" },
  { trigger: "Druk voor motivatie", response: "Gij kunt da! Of toch nie. Idk.", emoji: "💪" },
];

export default function EasterEggs() {
  const [visible, setVisible] = useState(false);
  const [egg, setEgg] = useState<EasterEgg | null>(null);
  const [clicked, setClicked] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    // 30% chance to show an easter egg on mount
    if (Math.random() < 0.3) {
      const randomEgg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
      setEgg(randomEgg);
      setPosition({
        top: 30 + Math.floor(Math.random() * 40),
        right: 5 + Math.floor(Math.random() * 15),
      });
      // Show after a random delay (3-8 seconds)
      const delay = 3000 + Math.random() * 5000;
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (clicked) {
      const t = setTimeout(() => {
        setVisible(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [clicked]);

  if (!visible || !egg) return null;

  return (
    <button
      onClick={() => setClicked(true)}
      className="fixed z-30 animate-bounce"
      style={{ top: `${position.top}%`, right: `${position.right}%` }}
    >
      <div className="rounded-xl border border-amber-500/40 bg-slate-800/90 px-4 py-2 shadow-lg backdrop-blur transition-all">
        {!clicked ? (
          <span className="text-sm font-medium text-amber-300">
            {egg.emoji} {egg.trigger}
          </span>
        ) : (
          <span className="text-sm font-bold text-white animate-pulse">
            {egg.response}
          </span>
        )}
      </div>
    </button>
  );
}
