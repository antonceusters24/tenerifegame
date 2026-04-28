"use client";

import { useState, useEffect, useCallback } from "react";

type RevealProps = {
  onComplete: () => void;
  animationType?: number;
};

const ANIMATIONS = [
  "slotMachine",
  "openBeer",
  "shotgun",
  "poker",
  "roulette",
  "cigar",
  "armWrestle",
  "snus",
  "wine",
  "cocktail",
] as const;

function SlotMachine({ onComplete }: { onComplete: () => void }) {
  const [slots, setSlots] = useState(["❓", "❓", "❓"]);
  const [label, setLabel] = useState("🎰 SPINNING...");

  useEffect(() => {
    const emojis = ["🍺", "�", "💰", "🚬", "🃏", "🎲", "🥃", "💪", "🔥", "🏋️"];
    let stopped = 0;

    const interval = setInterval(() => {
      setSlots((prev) =>
        prev.map((s, i) =>
          i < stopped ? s : emojis[Math.floor(Math.random() * emojis.length)]
        )
      );
    }, 80);

    const t1 = setTimeout(() => { stopped = 1; setSlots(prev => ["🍺", prev[1], prev[2]]); }, 800);
    const t2 = setTimeout(() => { stopped = 2; setSlots(prev => ["🍺", "🍺", prev[2]]); }, 1400);
    const t3 = setTimeout(() => { stopped = 3; clearInterval(interval); setSlots(["🍺", "🍺", "🍺"]); setLabel("JACKPOT! 🎰"); }, 2000);
    const t4 = setTimeout(onComplete, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold text-amber-400 animate-pulse">
        {label}
      </p>
      <div className="flex gap-3">
        {slots.map((s, i) => (
          <div
            key={i}
            className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-amber-500/50 bg-slate-800 text-4xl shadow-lg"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenBeer({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"shake" | "pop" | "pour" | "done">(
    "shake"
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pop"), 1200);
    const t2 = setTimeout(() => setPhase("pour"), 1800);
    const t3 = setTimeout(() => setPhase("done"), 2500);
    const t4 = setTimeout(onComplete, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`text-7xl transition-transform ${
          phase === "shake" ? "animate-bounce" : ""
        } ${phase === "pop" ? "scale-125" : ""}`}
      >
        {phase === "shake" && "🍺"}
        {phase === "pop" && "💥"}
        {phase === "pour" && "🍻"}
        {phase === "done" && "🎯"}
      </div>
      <p className="text-lg font-bold text-amber-400">
        {phase === "shake" && "Shaking the beer..."}
        {phase === "pop" && "PSSSHHH! 💨"}
        {phase === "pour" && "Pouring..."}
        {phase === "done" && "CHEERS! New challenge!"}
      </p>
    </div>
  );
}

function Shotgun({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => setPhase(4), 2800);
    const t5 = setTimeout(onComplete, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const frames = ["🍺", "🔑", "💨", "🍻", "💪"];
  const labels = [
    "Pakt uw bier...",
    "Steekt er een gat in...",
    "TREKKEN! TREKKEN!",
    "ADJES!!! 🫗",
    "ECHTE MAN! New challenge!",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-7xl transition-transform ${phase === 2 ? "animate-bounce" : ""} ${phase >= 3 ? "scale-125" : ""}`}>
        {frames[phase]}
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
    </div>
  );
}

function Poker({ onComplete }: { onComplete: () => void }) {
  const [cards, setCards] = useState(["🂠", "🂠", "🂠", "🂠", "🂠"]);
  const [label, setLabel] = useState("Dealen...");

  useEffect(() => {
    const hand = ["🂡", "🂮", "🂭", "🂫", "🂪"];
    const t1 = setTimeout(() => setCards(["🂡", "🂠", "🂠", "🂠", "🂠"]), 500);
    const t2 = setTimeout(() => setCards(["🂡", "🂮", "🂠", "🂠", "🂠"]), 900);
    const t3 = setTimeout(() => setCards(["🂡", "🂮", "🂭", "🂠", "🂠"]), 1300);
    const t4 = setTimeout(() => setCards(["🂡", "🂮", "🂭", "🂫", "🂠"]), 1700);
    const t5 = setTimeout(() => { setCards(hand); setLabel("ROYAL FLUSH! 👑"); }, 2100);
    const t6 = setTimeout(onComplete, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold text-amber-400">{label}</p>
      <div className="flex gap-1">
        {cards.map((c, i) => (
          <div key={i} className="flex h-20 w-14 items-center justify-center rounded-lg border-2 border-amber-500/50 bg-slate-800 text-3xl shadow-lg">
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cigar({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1000);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 2800);
    const t4 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["🌬️", "⚡", "💨", "😎"];
  const labels = [
    "Pakt uwen vape...",
    "Zet aan...",
    "Diiiepe trek...",
    "Ge zijt ready. New challenge!",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-7xl transition-all ${phase === 2 ? "scale-110 opacity-70" : ""} ${phase === 3 ? "scale-125" : ""}`}>
        {frames[phase]}
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
      {phase >= 2 && (
        <div className="flex gap-1 opacity-50">
          {["💨", "💨", "💨"].map((s, i) => (
            <span key={i} className="animate-pulse text-2xl" style={{ animationDelay: `${i * 200}ms` }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ArmWrestle({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(onComplete, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const labels = [
    "Pakken... 🤝",
    "3... 2... 1...",
    "DRUKKEN!!!",
    "💪 GEWONNEN! New challenge!",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <span className={`text-5xl transition-transform ${phase === 2 ? "-rotate-45" : ""} ${phase === 3 ? "-rotate-90" : ""}`}>
          🤛
        </span>
        <span className={`text-5xl transition-transform ${phase >= 2 ? "animate-pulse" : ""}`}>
          💥
        </span>
        <span className={`text-5xl transition-transform ${phase === 2 ? "rotate-12" : ""} ${phase === 3 ? "rotate-45 opacity-50" : ""}`}>
          🤜
        </span>
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
    </div>
  );
}

function Roulette({ onComplete }: { onComplete: () => void }) {
  const [angle, setAngle] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    let speed = 30;
    const interval = setInterval(() => {
      speed *= 0.97;
      current += speed;
      setAngle(current);
      if (speed < 0.5) {
        clearInterval(interval);
        setDone(true);
      }
    }, 30);
    const t = setTimeout(onComplete, 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, [onComplete]);

  const emojis = ["🍺", "🥃", "🚬", "🎲", "💰", "💪", "🃏", "🔥"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-500 bg-slate-800 text-4xl shadow-lg"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {emojis[Math.floor((angle / 45) % emojis.length)]}
        </div>
        <div className="absolute -top-2 text-2xl">▼</div>
      </div>
      <p className="text-lg font-bold text-amber-400">
        {done ? "🎯 NEW CHALLENGE!" : "Spinning the wheel..."}
      </p>
    </div>
  );
}

function Snus({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => setPhase(3), 2500);
    const t4 = setTimeout(onComplete, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["📦", "🤌", "😤", "🤙"];
  const labels = [
    "Doosje open...",
    "Legt ze onder de lip...",
    "BAAAAM die nicotine rush! 🚀",
    "Primed & ready. New challenge!",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-7xl transition-all ${phase === 2 ? "animate-bounce scale-110" : ""} ${phase === 3 ? "scale-125" : ""}`}>
        {frames[phase]}
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
      {phase === 2 && (
        <p className="animate-pulse text-sm text-green-400">⚡ BUZZ BUZZ BUZZ ⚡</p>
      )}
    </div>
  );
}

function Wine({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 2600);
    const t4 = setTimeout(onComplete, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["🍷", "🤏", "🫨", "🧐"];
  const labels = [
    "Schenkt in... met klasse",
    "*snuift* ...hmm ja, noten...",
    "*swirl swirl swirl*",
    "Exquis! New challenge, meneer!",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-7xl transition-all ${phase === 2 ? "animate-spin" : ""} ${phase === 3 ? "scale-110" : ""}`}>
        {frames[phase]}
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
      {phase === 1 && (
        <p className="text-xs italic text-gray-500">*doet alsof hij er iets van kent*</p>
      )}
    </div>
  );
}

function Cocktail({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(() => setPhase(4), 3000);
    const t5 = setTimeout(onComplete, 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  const frames = ["🧊", "🥃", "🍹", "🧉", "🍸"];
  const labels = [
    "Ijs in het glas...",
    "Shot erbij...",
    "Shaken baby! 🫨",
    "Parapluutje erin...",
    "Voilà! New challenge! 🍸",
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-7xl transition-all ${phase === 2 ? "animate-bounce" : ""} ${phase === 4 ? "scale-125" : ""}`}>
        {frames[phase]}
      </div>
      <p className="text-lg font-bold text-amber-400">{labels[phase]}</p>
      {phase === 2 && (
        <div className="flex gap-1">
          {["🧊", "🥃", "🍋"].map((s, i) => (
            <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${i * 100}ms` }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChallengeReveal({ onComplete, animationType }: RevealProps) {
  const stableOnComplete = useCallback(onComplete, [onComplete]);
  const type = ANIMATIONS[(animationType ?? Math.floor(Math.random() * ANIMATIONS.length)) % ANIMATIONS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-10 shadow-2xl">
        {type === "slotMachine" && <SlotMachine onComplete={stableOnComplete} />}
        {type === "openBeer" && <OpenBeer onComplete={stableOnComplete} />}
        {type === "shotgun" && <Shotgun onComplete={stableOnComplete} />}
        {type === "poker" && <Poker onComplete={stableOnComplete} />}
        {type === "roulette" && <Roulette onComplete={stableOnComplete} />}
        {type === "cigar" && <Cigar onComplete={stableOnComplete} />}
        {type === "armWrestle" && <ArmWrestle onComplete={stableOnComplete} />}
        {type === "snus" && <Snus onComplete={stableOnComplete} />}
        {type === "wine" && <Wine onComplete={stableOnComplete} />}
        {type === "cocktail" && <Cocktail onComplete={stableOnComplete} />}
      </div>
    </div>
  );
}
