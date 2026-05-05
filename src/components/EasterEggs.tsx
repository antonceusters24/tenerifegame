"use client";

import { useState, useEffect } from "react";
import { getGameStatus } from "@/lib/game";

type EasterEgg = {
  trigger: string;
  response: string;
  emoji?: string;
};

const EASTER_EGGS: EasterEgg[] = [
  { trigger: "Klik hier", response: "Good boy 🐶", emoji: "👆" },
  { trigger: "Niet klikken!", response: "Ge luistert ook nooit eh 🙄", emoji: "🚫" },
  { trigger: "Geheim bericht", response: "Anton is the GOAT 👑", emoji: "✉️" },
  { trigger: "Druk hier voor gratis bier", response: "Neje he. Gaat da zelf halen en pakt voor ons ook iets mee🍺", emoji: "🍺" },
  { trigger: "Tik 3x", response: "1x was genoeg sukkeleir 😂", emoji: "👈" },
  { trigger: "Wie wint er?", response: "Gij nie kanker mast", emoji: "🤔" },
  { trigger: "Klik voor wijsheid", response: "Wie nie drinkt, verliest punten", emoji: "🧠" },
  { trigger: "Open mij", response: "Proficiat! Ge hebt just niks gewonnen 🎉", emoji: "🎁" },
  { trigger: "Sssst...", response: "Homoooooooow 📢", emoji: "🤫" },
  { trigger: "Knock knock... Who's there?", response: "Uw dikke moeder jongeuh", emoji: "🔘" },
  { trigger: "Druk voor motivatie", response: "Fucking loser, nietsnut, platteeuhhh", emoji: "💪" },
  { trigger: "Gratis punten hier!", response: "Haha gij gelooft ook alles eh mongool", emoji: "🎰" },
  { trigger: "Lander zegt...", response: "boeie, niemand luistert daar dieje", emoji: "🗣️" },
  { trigger: "Berten zijn IQ =", response: "Error 404: Not Found", emoji: "🔢" },
  { trigger: "Klik voor een compliment", response: "Gij hebt echt ne schone volwaardige pens", emoji: "💐" },
  { trigger: "Geheim niews...", response: "Van vapen word je kaal", emoji: "🤐" },
  { trigger: "Druk als ge ne stoere zijt", response: "Ah kijk, nen dappere downie", emoji: "🦁" },
  { trigger: "Wat is het wachtwoord?", response: "LanderkeuhPanterkeuh69", emoji: "🔐" },
  { trigger: "Niet aankomen!", response: "Te laat. Nu hebde HIV.", emoji: "☣️" },
  { trigger: "Tenerife hack ontdekt", response: "Ge zijt gehacked. Groetjes, Anton.", emoji: "💻" },
  { trigger: "Klik voor buikspieren", response: "Door niks te doen krijgde geen buikspieren, tamme zak", emoji: "🏋️" },
  { trigger: "Dries zegt hi", response: "Dries zegt eigenlijk nooit iets zinnigs", emoji: "👋" },
  { trigger: "Geheime knop", response: "Anton krijgt +100pts. Merci!", emoji: "🔴" },
];

export default function EasterEggs() {
  const [visible, setVisible] = useState(false);
  const [egg, setEgg] = useState<EasterEgg | null>(null);
  const [clicked, setClicked] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const gameStatus = getGameStatus();

  useEffect(() => {
    // Only show easter eggs during active game (not countdown or end screen)
    if (gameStatus !== "active") return;

    // 50% chance to show an easter egg on mount
    if (Math.random() < 0.5) {
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
  }, [gameStatus]);

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
