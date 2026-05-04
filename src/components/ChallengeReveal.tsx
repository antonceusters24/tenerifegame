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
    }, 100);

    const t1 = setTimeout(() => { stopped = 1; setSlots(prev => ["🍺", prev[1], prev[2]]); }, 2200);
    const t2 = setTimeout(() => { stopped = 2; setSlots(prev => ["🍺", "🍺", prev[2]]); }, 3800);
    const t3 = setTimeout(() => { stopped = 3; clearInterval(interval); setSlots(["🍺", "🍺", "🍺"]); setLabel("JACKPOT! 🎰"); }, 5400);
    const t4 = setTimeout(onComplete, 7200);

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
    const t1 = setTimeout(() => setPhase("pop"), 2800);
    const t2 = setTimeout(() => setPhase("pour"), 4400);
    const t3 = setTimeout(() => setPhase("done"), 6200);
    const t4 = setTimeout(onComplete, 7800);
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
        {phase === "shake" && "Solleke pakken"}
        {phase === "pop" && "Aftrekken!"}
        {phase === "pour" && "Kappeuuuh."}
        {phase === "done" && "SOL!"}
      </p>
    </div>
  );
}

function Shotgun({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 3600);
    const t3 = setTimeout(() => setPhase(3), 5400);
    const t4 = setTimeout(() => setPhase(4), 7000);
    const t5 = setTimeout(onComplete, 8600);
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
    "Pakt nen bok",
    "Gatje prikken...",
    "TREKKEN! TREKKEN!",
    "ADJEEUUUUH 🫗",
    "Top he kameraad",
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
    const t1 = setTimeout(() => setCards(["🂡", "🂠", "🂠", "🂠", "🂠"]), 1200);
    const t2 = setTimeout(() => setCards(["🂡", "🂮", "🂠", "🂠", "🂠"]), 2400);
    const t3 = setTimeout(() => setCards(["🂡", "🂮", "🂭", "🂠", "🂠"]), 3600);
    const t4 = setTimeout(() => setCards(["🂡", "🂮", "🂭", "🂫", "🂠"]), 4800);
    const t5 = setTimeout(() => { setCards(hand); setLabel("ROYAL FLUSH! 👑"); }, 6000);
    const t6 = setTimeout(onComplete, 7800);
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
    const t1 = setTimeout(() => setPhase(1), 2400);
    const t2 = setTimeout(() => setPhase(2), 4800);
    const t3 = setTimeout(() => setPhase(3), 7000);
    const t4 = setTimeout(onComplete, 8800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["🌬️", "⚡", "💨", "😎"];
  const labels = [
    "Pakt uwe vape...",
    "Ne keer goe sleuren",
    "Inhaleren...",
    "Poahhhh heerlijk",
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
  // armAngle: 0 = centre, negative = left winning, positive = right winning
  const [armAngle, setArmAngle] = useState(0);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    // phase 0: grip — arms locked upright
    const t1 = setTimeout(() => setPhase(1), 2000);          // countdown
    const t2 = setTimeout(() => { setPhase(2); setShaking(true); }, 4000); // battle starts
    // battle: arms sway back and forth
    const t3 = setTimeout(() => setArmAngle(-25), 4600);
    const t4 = setTimeout(() => setArmAngle(20), 5500);
    const t5 = setTimeout(() => setArmAngle(-30), 6300);
    const t6 = setTimeout(() => setArmAngle(15), 7000);
    const t7 = setTimeout(() => setArmAngle(-20), 7600);
    // left arm slams down — winner!
    const t8 = setTimeout(() => { setPhase(3); setShaking(false); setArmAngle(-80); }, 8400);
    const t9 = setTimeout(onComplete, 10200);
    return () => {
      [t1,t2,t3,t4,t5,t6,t7,t8,t9].forEach(clearTimeout);
    };
  }, [onComplete]);

  const labels = [
    "Handen vast... 🤝",
    "3... 2... 1... DUWWWE!",
    "PUSH PUSH PUSH!!!",
    "💪 GEWONNEN! Nieuwe challenge!",
  ];

  // Left arm (challenger): rotates from straight up toward the table on the right (positive angle = going down-right)
  // Right arm (player): mirror image. We use armAngle to tilt both arms.
  // armAngle negative = left arm winning (pushing right arm down), positive = right arm pushing back
  const leftArmRotation = phase >= 2 ? armAngle : 0;
  const rightArmRotation = phase >= 2 ? -armAngle : 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-lg font-bold text-amber-400 min-h-[28px]">{labels[phase]}</p>

      {/* Table surface */}
      <div className="relative flex items-end justify-center gap-0" style={{ height: 120 }}>
        {/* Left arm */}
        <div
          className="origin-bottom transition-transform"
          style={{
            transformOrigin: "bottom center",
            transform: `rotate(${leftArmRotation}deg)`,
            transitionDuration: phase === 3 ? "400ms" : "350ms",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          <div className={`flex flex-col items-center gap-0 ${shaking && phase === 2 ? "animate-bounce" : ""}`} style={{ animationDuration: "150ms" }}>
            <span className="text-4xl" style={{ display: "block", transform: "scaleX(-1)" }}>💪</span>
            <span className="text-3xl" style={{ display: "block", transform: "scaleX(-1)" }}>✊</span>
          </div>
        </div>

        {/* Clasped hands in centre */}
        <div className="relative z-10 mx-1 flex flex-col items-center" style={{ marginBottom: 4 }}>
          <span className={`text-2xl ${phase === 2 ? "animate-pulse" : ""} ${phase === 3 ? "opacity-0" : ""}`}>🤝</span>
        </div>

        {/* Right arm */}
        <div
          className="origin-bottom transition-transform"
          style={{
            transformOrigin: "bottom center",
            transform: `rotate(${rightArmRotation}deg)`,
            transitionDuration: phase === 3 ? "400ms" : "350ms",
            transitionTimingFunction: "ease-in-out",
          }}
        >
          <div className={`flex flex-col items-center gap-0 ${shaking && phase === 2 ? "animate-bounce" : ""}`} style={{ animationDuration: "200ms" }}>
            <span className="text-4xl">💪</span>
            <span className="text-3xl">✊</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="h-3 w-56 rounded-full bg-amber-900/60 border border-amber-700/40 shadow-lg" />

      {phase === 3 && (
        <p className="animate-pulse text-sm font-bold text-emerald-400">⚡ BEAST MODE ⚡</p>
      )}
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
      speed *= 0.988;
      current += speed;
      setAngle(current);
      if (speed < 0.5) {
        clearInterval(interval);
        setDone(true);
      }
    }, 30);
    const t = setTimeout(onComplete, 8000);
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
    const t1 = setTimeout(() => setPhase(1), 2200);
    const t2 = setTimeout(() => setPhase(2), 4400);
    const t3 = setTimeout(() => setPhase(3), 6400);
    const t4 = setTimeout(onComplete, 8200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["📦", "🤌", "😤", "🤙"];
  const labels = [
    "Doosje open doen..",
    "Snuske onder de lip leggen...",
    "BAAAAM nicotine kick!",
    "Kleir voor de nieuwe challenge",
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
    const t1 = setTimeout(() => setPhase(1), 2400);
    const t2 = setTimeout(() => setPhase(2), 4800);
    const t3 = setTimeout(() => setPhase(3), 7000);
    const t4 = setTimeout(onComplete, 8800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const frames = ["🍷", "🤏", "🫨", "🧐"];
  const labels = [
    "Wijntje inschenken...",
    "*snuift* hmmm lekkerrr",
    "*beetje schudden*",
    "Bah ik proef kurk",
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
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 3800);
    const t3 = setTimeout(() => setPhase(3), 5800);
    const t4 = setTimeout(() => setPhase(4), 7600);
    const t5 = setTimeout(onComplete, 9400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  const frames = ["🧊", "🥃", "🍹", "🧉", "🍸"];
  const labels = [
    "Ijs in het glas...",
    "Shotje dabei...",
    "Shaken baby! 🫨",
    "Parapluutje erin...",
    "Hupse! Kleir 🍸",
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
