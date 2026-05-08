"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { login, validateLogin } from "./actions";
import { getGameStatus } from "@/lib/game";

/* ───────── constants ───────── */

const TROLL_MESSAGES = [
  "Het was just ze, maar doetet toch nog ma ne keer",
  "Jaja das juist, maar bewijst het nog ne keer 💅",
  "Top he, uwe PIN was just, mor omda ge zo lelek zijt moogde da nog is doen, mercikesss",
  "Ne juste! Nog zo eentje 🫡",
];

const SUBTITLES = [
  "4 mannen, 1 braincell",
  "Georganiseerd door niemand die weet wa hij doet",
  "Sponsored by Sir Lancelot en de veepneger van Lander",
  "Mannen op missie, vrouwen in paniek",
  "What happens in Tenerife, stays in Tenerife...",
  "De IQ daalt, de fun stijgt",
  "Featuring Lander, Berten, Dries en Anton",
  "Vier legendes, nul plan",
  "Operatie levercirrose 🍺",
];

const INTRO_MESSAGES = [
  { title: "STOP! ✋", body: "Ge kunt hier nie zomaar inloggen...\nGe moet er voor spelen bradda!" },
  { title: "Ela! 🛑", body: "Dacht ge da ge gewoon kon inloggen?\nNee nee, eerst spelen kameradski!" },
  { title: "Ho ho ho! 🚫", body: "Hier wordt nie gratis ingelogd.\nEerst uwe naam verdienen copain!" },
  { title: "Hooo es even! 🖐️", body: "Inloggen is te makkelijk.\nHier speelde voor uwe naam makker!" },
  { title: "NOPE! 😤", body: "Gewoon inloggen? Da's voor losers.\nHier wordt gespeeld rekel!" },
];

type Player = { name: string; emoji: string; tagline: string };

const PLAYERS: Player[] = [
  { name: "Lander", emoji: "🎨", tagline: "Panterke" },
  { name: "Berten", emoji: "🤖", tagline: "Safferke" },
  { name: "Dries", emoji: "🤫", tagline: "Wim Helsen" },
  { name: "Anton", emoji: "👑", tagline: "Baldie" },
];

const ADMINS = [
  { name: "Hanne", label: "Hanne" },
  { name: "Klaas", label: "Klaas" },
  { name: "Remy", label: "Remy" },
  { name: "Cédric", label: "Cédric" },
];

type AnimationType = "spin" | "dice" | "roulette" | "magic8" | "lightning" | "eenymeeny";
const ANIMATION_TYPES: AnimationType[] = ["spin", "dice", "roulette", "magic8", "lightning", "eenymeeny"];

const ANIMATION_LABELS: Record<AnimationType, { label: string; button: string; activeButton: string }> = {
  spin:      { label: "Draai aan het wiel!",   button: "SPIN!",      activeButton: "Bezig met draaien..." },
  dice:      { label: "Gooi de dobbelsteen!",   button: "Roll the dice lil nigga!",      activeButton: "De dobbelsteen rolt..." },
  roulette:  { label: "Russian Roulette!",      button: "I can't breathe!",      activeButton: "Tik... tik... tik..." },
  magic8:    { label: "Schud de sneeuwbol!",  button: "Schuddeuh bolleuh pats!",  activeButton: "De bol schudt..." },
  lightning: { label: "Wie wordt er geraakt?",   button: "STRIKE!",     activeButton: "Laden..." },
  eenymeeny: { label: "ienemienemutte",          button: "Starteuh!",     activeButton: "Joehoeeee..." },
};

const EENY_MEENY_WORDS = [
  "Iene", "miene", "mutte", "tien", "pond", "grutten",
  "tien", "pond", "kaas", "iene", "miene", "mutte",
  "is", "de", "baas!",
];

/* ── helpers ── */
function PlayerAvatar({ player, urls, size = "h-12 w-12" }: { player: Player; urls: Record<string, string>; size?: string }) {
  return urls[player.name] ? (
    <img src={urls[player.name]} alt={player.name} className={`rounded-full object-cover ${size}`} />
  ) : (
    <span className={`flex items-center justify-center rounded-full bg-slate-600 text-xl ${size}`}>{player.emoji}</span>
  );
}

/* ───────── component ───────── */

type LoginClientProps = { avatarUrls?: Record<string, string> };

export default function LoginClient({ avatarUrls = {} }: LoginClientProps) {
  const [trollMsg, setTrollMsg] = useState<string | null>(null);
  const [trolled, setTrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [subtitle, setSubtitle] = useState(SUBTITLES[0]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { setSubtitle(SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)]); }, []);

  const [gameActive] = useState(() => getGameStatus() === "active");

  // 30% chance of game login during active game
  const [useGameLogin, setUseGameLogin] = useState(false);
  useEffect(() => { if (gameActive) setUseGameLogin(Math.random() < 0.45); }, [gameActive]);

  // Game login phases: intro → ready → animating → result
  const [phase, setPhase] = useState<"intro" | "ready" | "animating" | "result">("intro");
  const [resultMessage, setResultMessage] = useState("");

  // Animation type — fixed per session (page load)
  const [animType, setAnimType] = useState<AnimationType>("spin");
  useEffect(() => { setAnimType(ANIMATION_TYPES[Math.floor(Math.random() * ANIMATION_TYPES.length)]); }, []);

  // Intro message — fixed per session
  const [introMsg, setIntroMsg] = useState(INTRO_MESSAGES[0]);
  useEffect(() => { setIntroMsg(INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)]); }, []);

  // ── Spin
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinReady, setSpinReady] = useState(true);
  // ── Dice
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceFace, setDiceFace] = useState(-1);
  // ── Roulette (revolver)
  const [rouletteAim, setRouletteAim] = useState(-1);
  const [rouletteShot, setRouletteShot] = useState(-1);
  const [roulettePhase, setRoulettePhase] = useState<"idle" | "spinning" | "aiming" | "click" | "bang">("idle");
  const [rouletteMisses, setRouletteMisses] = useState<number[]>([]);
  // ── Magic 8‑ball (snow globe)
  const [magic8Phase, setMagic8Phase] = useState<"idle" | "shaking" | "revealing">("idle");
  const [magic8Player, setMagic8Player] = useState(-1);
  const [snowParticles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      emoji: ["❄️", "✨", "⭐", "💫", "🌟"][Math.floor(Math.random() * 5)],
    }))
  );
  // ── Lightning
  const [lightningFlashes, setLightningFlashes] = useState<number[]>([]);
  const [lightningStruck, setLightningStruck] = useState(-1);
  const [lightningPhase, setLightningPhase] = useState<"idle" | "charging" | "flickering" | "strike" | "aftermath">("idle");
  // ── Eeny meeny
  const [eenyWord, setEenyWord] = useState("");
  const [eenyPointer, setEenyPointer] = useState(-1);

  // Troll progress bar
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Secret admin
  const [beerTaps, setBeerTaps] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminName, setAdminName] = useState("");
  const beerTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBeerTap = useCallback(() => {
    setBeerTaps((prev) => { const n = prev + 1; if (n >= 5) { setShowAdminLogin(true); return 0; } return n; });
    if (beerTapTimer.current) clearTimeout(beerTapTimer.current);
    beerTapTimer.current = setTimeout(() => setBeerTaps(0), 3000);
  }, []);

  /* ── finish ── */
  function finishAnimation(idx: number) {
    setSelectedPlayer(PLAYERS[idx].name);
    setResultMessage("En de winnaar is...");
    setPhase("result");
  }

  /* ── play again (same game) — starts immediately ── */
  function handlePlayAgain() {
    setSelectedPlayer("");
    setResultMessage("");
    setSpinReady(true);
    setDiceFace(-1); setDiceRolling(false);
    setRouletteAim(-1); setRouletteShot(-1); setRoulettePhase("idle"); setRouletteMisses([]);
    setMagic8Phase("idle"); setMagic8Player(-1);
    setLightningFlashes([]); setLightningStruck(-1); setLightningPhase("idle");
    setEenyWord(""); setEenyPointer(-1);
    setPhase("animating");
    // Small delay so state resets render before animation starts
    setTimeout(() => {
      switch (animType) {
        case "spin": runSpin(); break;
        case "dice": runDice(); break;
        case "roulette": runRoulette(); break;
        case "magic8": runMagic8(); break;
        case "lightning": runLightning(); break;
        case "eenymeeny": runEenyMeeny(); break;
      }
    }, 50);
  }

  /* ═══════ ANIMATION RUNNERS ═══════ */

  function runSpin() {
    const idx = Math.floor(Math.random() * PLAYERS.length);
    const seg = 360 / PLAYERS.length;
    const extra = (3 + Math.floor(Math.random() * 3)) * 360;
    setSpinReady(false);
    requestAnimationFrame(() => {
      setSpinAngle((prev) => prev + extra + (360 - idx * seg - seg / 2));
      setTimeout(() => finishAnimation(idx), 3200);
    });
  }

  function runDice() {
    const idx = Math.floor(Math.random() * PLAYERS.length);
    setDiceRolling(true);
    setDiceFace(-1);
    let step = 0;
    const total = 18;
    const tick = () => {
      step++;
      setDiceFace(Math.floor(Math.random() * PLAYERS.length));
      if (step >= total) { setDiceFace(idx); setDiceRolling(false); setTimeout(() => finishAnimation(idx), 600); return; }
      setTimeout(tick, step < 10 ? 80 : step < 14 ? 150 : 300);
    };
    setTimeout(tick, 80);
  }

  function runRoulette() {
    const targetIdx = Math.floor(Math.random() * PLAYERS.length);
    const totalRounds = 2 + Math.floor(Math.random() * 3); // 2–4 trigger pulls
    const bulletRound = Math.floor(Math.random() * totalRounds); // bullet can be in ANY round
    // Build aim order: random players for each round, bullet round aims at target
    const others = PLAYERS.map((_, i) => i).filter(i => i !== targetIdx);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const aimOrder: number[] = [];
    let otherIdx = 0;
    for (let r = 0; r < totalRounds; r++) {
      if (r === bulletRound) {
        aimOrder.push(targetIdx);
      } else {
        aimOrder.push(others[otherIdx % others.length]);
        otherIdx++;
      }
    }

    setRouletteAim(-1);
    setRouletteShot(-1);
    setRouletteMisses([]);
    setRoulettePhase("spinning");

    setTimeout(() => {
      let round = 0;
      function playRound() {
        const aimTarget = aimOrder[round];
        const isBullet = round === bulletRound;
        setRoulettePhase("aiming");
        // Quick cycling to build tension
        let step = 0;
        const aimSteps = 6 + Math.floor(Math.random() * 4);
        const aimTick = () => {
          step++;
          setRouletteAim(step % PLAYERS.length);
          if (step >= aimSteps) {
            setRouletteAim(aimTarget);
            // Tension pause before pulling the trigger
            setTimeout(() => {
              if (isBullet) {
                setRoulettePhase("bang");
                setRouletteShot(aimTarget);
                setTimeout(() => finishAnimation(aimTarget), 1200);
              } else {
                // Empty chamber — *click*
                setRoulettePhase("click");
                setRouletteMisses(prev => [...prev, aimTarget]);
                setTimeout(() => {
                  round++;
                  setRoulettePhase("spinning");
                  setRouletteAim(-1);
                  setTimeout(() => playRound(), 800);
                }, 1100);
              }
            }, 800);
            return;
          }
          setTimeout(aimTick, 100);
        };
        setTimeout(aimTick, 100);
      }
      playRound();
    }, 1200);
  }

  function runMagic8() {
    const idx = Math.floor(Math.random() * PLAYERS.length);
    setMagic8Phase("shaking");
    setMagic8Player(-1);
    let step = 0;
    const tick = () => {
      step++;
      setMagic8Player(Math.floor(Math.random() * PLAYERS.length));
      if (step >= 20) {
        setMagic8Phase("revealing");
        setMagic8Player(-1);
        setTimeout(() => { setMagic8Player(idx); setTimeout(() => { setMagic8Phase("idle"); finishAnimation(idx); }, 1000); }, 1000);
        return;
      }
      setTimeout(tick, 60);
    };
    setTimeout(tick, 60);
  }

  function runLightning() {
    const idx = Math.floor(Math.random() * PLAYERS.length);
    setLightningStruck(-1);
    setLightningFlashes([]);
    // Phase 1: Charging — sky darkens, tension builds
    setLightningPhase("charging");
    setTimeout(() => {
      // Phase 2: Flickering — random flashes across players
      setLightningPhase("flickering");
      let step = 0;
      const total = 20;
      const tick = () => {
        step++;
        // Random flashes, getting more intense
        const flashCount = step < 10 ? 1 : step < 15 ? 2 : 3;
        const indices = Array.from({ length: PLAYERS.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5).slice(0, flashCount);
        setLightningFlashes(indices);
        if (step >= total) {
          setLightningFlashes([]);
          // Phase 3: Final strike
          setTimeout(() => {
            setLightningPhase("strike");
            setLightningStruck(idx);
            setLightningFlashes([idx]);
            // Phase 4: Aftermath
            setTimeout(() => {
              setLightningPhase("aftermath");
              setTimeout(() => finishAnimation(idx), 800);
            }, 800);
          }, 300);
          return;
        }
        setTimeout(tick, step < 10 ? 60 : step < 16 ? 100 : 150);
      };
      setTimeout(tick, 60);
    }, 1200);
  }

  function runEenyMeeny() {
    const idx = Math.floor(Math.random() * PLAYERS.length);
    let wIdx = 0;
    const startOff = ((idx - (EENY_MEENY_WORDS.length - 1) % PLAYERS.length) + PLAYERS.length * 4) % PLAYERS.length;
    let pIdx = startOff;
    const tick = () => {
      if (wIdx >= EENY_MEENY_WORDS.length) {
        setEenyWord("👉 " + PLAYERS[idx].name + "! 👈");
        setEenyPointer(idx);
        setTimeout(() => finishAnimation(idx), 800);
        return;
      }
      setEenyWord(EENY_MEENY_WORDS[wIdx]);
      setEenyPointer(pIdx % PLAYERS.length);
      wIdx++;
      pIdx++;
      setTimeout(tick, 350);
    };
    setTimeout(tick, 350);
  }

  function handlePlay() {
    if (phase === "animating") return;
    setPhase("animating");
    setSelectedPlayer("");
    setResultMessage("");

    switch (animType) {
      case "spin": runSpin(); break;
      case "dice": runDice(); break;
      case "roulette": runRoulette(); break;
      case "magic8": runMagic8(); break;
      case "lightning": runLightning(); break;
      case "eenymeeny": runEenyMeeny(); break;
    }
  }

  /* ═══════ VISUAL RENDERERS ═══════ */

  /* 🎰 SPIN WHEEL */
  function renderSpinWheel() {
    const sz = 220, r = sz / 2;
    const seg = 360 / PLAYERS.length;
    const colors = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981"];
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: sz, height: sz }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-2xl select-none">▼</div>
          <svg width={sz} height={sz} className="drop-shadow-lg"
            style={{ transform: `rotate(${spinAngle}deg)`, transition: spinReady ? "none" : "transform 3s cubic-bezier(0.17,0.67,0.12,0.99)" }}>
            {PLAYERS.map((p, i) => {
              const s = (i * seg - 90) * Math.PI / 180;
              const e = ((i + 1) * seg - 90) * Math.PI / 180;
              const x1 = r + r * Math.cos(s), y1 = r + r * Math.sin(s);
              const x2 = r + r * Math.cos(e), y2 = r + r * Math.sin(e);
              const la = seg > 180 ? 1 : 0;
              const m = ((i + 0.5) * seg - 90) * Math.PI / 180;
              const tx = r + r * 0.55 * Math.cos(m), ty = r + r * 0.55 * Math.sin(m);
              return (
                <g key={p.name}>
                  <path d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${la},1 ${x2},${y2} Z`} fill={colors[i]} stroke="#1e293b" strokeWidth="2" />
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold" fontSize="13">{p.name}</text>
                </g>
              );
            })}
            <circle cx={r} cy={r} r="18" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  }

  /* 🎲 DICE */
  function renderDice() {
    const p = diceFace >= 0 ? PLAYERS[diceFace] : null;
    return (
      <div className="flex flex-col items-center">
        <div className={`flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-white/20 bg-white shadow-2xl transition-all duration-150 ${diceRolling ? "animate-diceRoll" : ""}`}>
          {p ? (
            <div className="flex flex-col items-center gap-1.5">
              <PlayerAvatar player={p} urls={avatarUrls} size="h-16 w-16" />
              <span className="text-sm font-extrabold text-slate-800">{p.name}</span>
            </div>
          ) : (
            <span className="text-6xl select-none">🎲</span>
          )}
        </div>
        <div className="mt-2 flex gap-1">
          {PLAYERS.map((pl, i) => (
            <div key={pl.name} className={`h-2.5 w-2.5 rounded-full transition-colors ${diceFace === i ? "bg-amber-400" : "bg-slate-600"}`} />
          ))}
        </div>
      </div>
    );
  }

  /* 💣 ROULETTE */
  function renderRoulette() {
    const sz = 260, r = sz / 2, pR = r - 44;
    // Revolver angle: points at aimed player
    const gunAngle = rouletteAim >= 0 ? rouletteAim * (360 / PLAYERS.length) - 90 : -90;
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: sz, height: sz }}>
          {/* Dark background circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-2xl border-4 border-slate-600" />

          {/* Revolver cylinder in center */}
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            ${roulettePhase === "spinning" ? "animate-spin" : ""}`}>
            {/* Cylinder body */}
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-gray-500 via-gray-400 to-gray-600 border-2 border-gray-700 shadow-xl">
              {/* Chamber holes */}
              {[0, 1, 2, 3, 4, 5].map((c) => {
                const ca = (c * 60 - 90) * Math.PI / 180;
                const cx = 40 + 22 * Math.cos(ca) - 6;
                const cy = 40 + 22 * Math.sin(ca) - 6;
                return (
                  <div key={c} className={`absolute h-3 w-3 rounded-full border border-gray-800
                    ${c === 0 ? "bg-amber-600 shadow-inner shadow-amber-800" : "bg-gray-800 shadow-inner"}`}
                    style={{ left: cx, top: cy }}
                  />
                );
              })}
              {/* Center pin */}
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-700 border border-gray-900" />
            </div>
          </div>

          {/* Gun barrel — aims at target */}
          <div className="absolute left-1/2 top-1/2 z-20 transition-transform duration-300"
            style={{ transform: `translate(-50%, -50%) rotate(${gunAngle + 90}deg)`, transformOrigin: "center center" }}>
            <div className="flex flex-col items-center">
              {/* Barrel */}
              <div className="h-10 w-3 rounded-t-sm bg-gradient-to-b from-gray-600 to-gray-400 border border-gray-700 shadow-md" />
              {/* Muzzle flash on bang */}
              {roulettePhase === "bang" && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="text-2xl animate-ping">💥</div>
                </div>
              )}
            </div>
          </div>

          {/* Players around the circle */}
          {PLAYERS.map((p, i) => {
            const angle = (i * (360 / PLAYERS.length) - 90) * Math.PI / 180;
            const x = r + pR * Math.cos(angle);
            const y = r + pR * Math.sin(angle);
            const aimed = rouletteAim === i;
            const shot = rouletteShot === i;
            const survived = rouletteMisses.includes(i);
            const clicking = roulettePhase === "click" && aimed;
            return (
              <div key={p.name} className={`absolute flex flex-col items-center transition-all duration-200
                ${shot ? "scale-125 z-30" : aimed ? "scale-110 z-20" : ""}`}
                style={{ left: x - 28, top: y - 28, width: 56, height: 56 }}>
                {/* Crosshair on aimed player */}
                {aimed && !shot && !clicking && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="h-14 w-14 rounded-full border-2 border-red-500/70 animate-pulse" />
                    <div className="absolute h-14 w-0.5 bg-red-500/40" />
                    <div className="absolute h-0.5 w-14 bg-red-500/40" />
                  </div>
                )}
                {/* Empty click — survived! */}
                {clicking && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-base font-black text-gray-400 animate-fadeIn z-30">
                    *klik*
                  </div>
                )}
                {/* BANG effect on shot player */}
                {shot && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl font-black text-red-500 animate-bounce z-30">
                    BANG!
                  </div>
                )}
                <div className={`rounded-full p-[3px] transition-all duration-200
                  ${shot ? "ring-4 ring-red-500 bg-red-500/30 shadow-lg shadow-red-500/60"
                    : clicking ? "ring-3 ring-gray-400/60 bg-gray-500/20"
                    : survived ? "ring-2 ring-green-500/50 bg-green-500/10"
                    : aimed ? "ring-2 ring-red-400/60"
                    : "bg-slate-700"}`}>
                  <PlayerAvatar player={p} urls={avatarUrls} size="h-11 w-11" />
                </div>
                {/* Survived badge */}
                {survived && !aimed && (
                  <span className="absolute -top-1 -right-1 text-xs z-30">😮‍💨</span>
                )}
                <span className={`text-[10px] font-bold mt-0.5
                  ${shot ? "text-red-400" : survived ? "text-green-400/80" : aimed ? "text-red-300" : "text-white/70"}`}>{p.name}</span>
              </div>
            );
          })}
        </div>

        {/* Phase text */}
        {roulettePhase === "spinning" && (
          <p className="mt-2 text-sm text-gray-400 italic animate-pulse">*klik klik klik klik...*</p>
        )}
        {roulettePhase === "click" && (
          <p className="mt-2 text-sm text-gray-300 font-medium animate-fadeIn">*klik* ... lege kamer 😰</p>
        )}
        {roulettePhase === "bang" && (
          <p className="mt-2 text-sm text-red-400 font-bold animate-fadeIn">💀 Geraakt!</p>
        )}
      </div>
    );
  }

  /* 🔮 SNOW GLOBE */
  function renderMagic8() {
    const showP = magic8Phase === "revealing" && magic8Player >= 0 ? PLAYERS[magic8Player]
      : magic8Phase === "idle" && selectedPlayer ? PLAYERS.find(p => p.name === selectedPlayer)
      : null;
    const isShaking = magic8Phase === "shaking";
    const isRevealing = magic8Phase === "revealing" && magic8Player >= 0;
    return (
      <div className="flex flex-col items-center">
        {/* Globe */}
        <div className={`relative overflow-hidden rounded-full shadow-2xl
          ${isShaking ? "animate-magic8Shake" : ""}`}
          style={{ width: 200, height: 200 }}>
          {/* Glass dome */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-sky-200/10 via-sky-100/5 to-white/5 border-4 border-sky-200/20" />
          {/* Inner background — dreamy sky gradient */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900 overflow-hidden">
            {/* Snow/sparkle particles */}
            {snowParticles.map((p) => (
              <div key={p.id} className="absolute text-[8px] select-none"
                style={{
                  left: `${p.x}%`,
                  top: isShaking ? `${(p.y + 30) % 100}%` : `${p.y}%`,
                  fontSize: p.size,
                  opacity: isShaking ? 0.9 : isRevealing ? 0.3 : 0.6,
                  transition: "all 0.3s",
                  animation: isShaking
                    ? `snowfall ${p.duration * 0.3}s ease-in-out ${p.delay * 0.2}s infinite`
                    : `snowfall ${p.duration}s ease-in-out ${p.delay}s infinite`,
                }}>
                {p.emoji}
              </div>
            ))}

            {/* Center content */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700
              ${isRevealing ? "scale-110 opacity-100" : isShaking ? "scale-75 opacity-20" : "opacity-100"}`}>
              {showP ? (
                <>
                  <div className={`transition-all duration-500 ${isRevealing ? "animate-fadeIn" : ""}`}>
                    <PlayerAvatar player={showP} urls={avatarUrls} size="h-16 w-16" />
                  </div>
                  <span className="mt-1 text-sm font-bold text-white drop-shadow-lg">{showP.name}</span>
                </>
              ) : (
                <span className="text-5xl select-none opacity-60">🔮</span>
              )}
            </div>

            {/* Reveal glow */}
            {isRevealing && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-400/20 via-transparent to-transparent animate-pulse" />
            )}
          </div>

          {/* Glass shine */}
          <div className="absolute top-3 left-6 h-10 w-16 rounded-full bg-white/10 blur-md" />
          <div className="absolute top-5 left-8 h-4 w-10 rounded-full bg-white/20 blur-sm" />
        </div>

        {/* Base/pedestal */}
        <div className="-mt-2 h-6 w-28 rounded-b-xl bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-600/50 shadow-lg" />

        {/* Phase text */}
        {isShaking && (
          <p className="mt-2 text-sm text-purple-300 italic animate-pulse">*schud schud schud...*</p>
        )}
      </div>
    );
  }

  /* ⚡ LIGHTNING */
  function renderLightning() {
    const isCharging = lightningPhase === "charging";
    const isFlickering = lightningPhase === "flickering";
    const isStrike = lightningPhase === "strike";
    const isAftermath = lightningPhase === "aftermath";
    return (
      <div className="flex flex-col items-center">
        {/* Storm cloud */}
        <div className={`relative mb-4 text-center select-none transition-all duration-500
          ${isCharging ? "scale-110" : isStrike ? "scale-125" : ""}`}>
          <span className={`text-5xl transition-all duration-300
            ${isCharging ? "opacity-80 animate-pulse" : isFlickering || isStrike ? "opacity-100" : "opacity-60"}`}>⛈️</span>
          {/* Charging sparks */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-yellow-300/20 animate-ping" />
            </div>
          )}
        </div>

        {/* Lightning bolt SVG — appears on strike */}
        {isStrike && lightningStruck >= 0 && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fadeIn">
            <svg width="40" height="60" viewBox="0 0 40 60" className="drop-shadow-lg" style={{ filter: "drop-shadow(0 0 10px #facc15)" }}>
              <polygon points="22,0 8,28 18,28 12,60 34,24 22,24 30,0" fill="#facc15" stroke="#eab308" strokeWidth="1" />
            </svg>
          </div>
        )}

        {/* Background flash on strike */}
        {isStrike && (
          <div className="absolute inset-0 rounded-2xl bg-yellow-300/10 animate-pulse pointer-events-none z-0" />
        )}

        {/* Player grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {PLAYERS.map((p, i) => {
            const flashing = lightningFlashes.includes(i);
            const struck = lightningStruck === i;
            const safe = isAftermath && !struck;
            return (
              <div key={p.name} className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all
                ${struck ? "border-yellow-400 bg-yellow-400/25 scale-110 shadow-xl shadow-yellow-400/50 duration-100"
                  : safe ? "border-green-500/40 bg-green-500/10 duration-300"
                  : flashing ? "border-yellow-300/70 bg-yellow-300/10 scale-105 duration-75"
                  : isCharging ? "border-slate-500 bg-slate-800/80 duration-500"
                  : "border-slate-600 bg-slate-700/60 duration-200"}`}>
                {/* Strike effect */}
                {struck && (
                  <>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl z-30 animate-bounce">⚡</div>
                    <div className="absolute inset-0 rounded-xl bg-yellow-300/20 animate-ping" />
                  </>
                )}
                {/* Safe badge */}
                {safe && (
                  <div className="absolute -top-2 -right-2 text-sm z-30">😌</div>
                )}
                {/* Flash overlay */}
                {flashing && !struck && (
                  <div className="absolute inset-0 rounded-xl bg-yellow-200/8" />
                )}
                <div className={`transition-all duration-200 ${struck ? "brightness-150" : isCharging ? "brightness-75" : ""}`}>
                  <PlayerAvatar player={p} urls={avatarUrls} size="h-12 w-12" />
                </div>
                <span className={`text-sm font-bold transition-colors
                  ${struck ? "text-yellow-300" : safe ? "text-green-300" : "text-white"}`}>{p.name}</span>
              </div>
            );
          })}
        </div>

        {/* Phase text */}
        {isCharging && (
          <p className="mt-3 text-sm text-gray-400 italic animate-pulse">De lucht betrekt...</p>
        )}
        {isFlickering && (
          <p className="mt-3 text-sm text-yellow-300/80 italic animate-pulse">⚡ Het onweert...</p>
        )}
        {(isStrike || isAftermath) && lightningStruck >= 0 && (
          <p className="mt-3 text-sm text-yellow-400 font-bold animate-fadeIn">💥 {PLAYERS[lightningStruck].name} is geraakt!</p>
        )}
      </div>
    );
  }

  /* 🎯 EENY MEENY */
  function renderEenyMeeny() {
    const sz = 220, r = sz / 2, pR = r - 36;
    const pointerAngle = eenyPointer >= 0 ? eenyPointer * (360 / PLAYERS.length) - 90 : -90;
    const isActive = eenyPointer >= 0;
    return (
      <div className="flex flex-col items-center">
        {/* Word display */}
        <div className="mb-3 h-9 text-center text-xl font-extrabold text-amber-300">
          {eenyWord || <span className="text-gray-500 text-sm font-normal italic">Klaar voor aftellen...</span>}
        </div>
        <div className="relative" style={{ width: sz, height: sz }}>
          {/* Outer glow ring */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500
            ${isActive ? "shadow-lg shadow-amber-500/20" : ""}`} />
          {/* Circle track */}
          <div className={`absolute inset-6 rounded-full border-2 border-dashed transition-colors duration-300
            ${isActive ? "border-amber-500/30" : "border-slate-600"}`} />

          {/* Pointer beam — rotates around center */}
          <div className="absolute left-1/2 top-1/2 z-10 transition-transform duration-250 ease-out"
            style={{
              transform: `translate(-50%, -50%) rotate(${pointerAngle + 90}deg)`,
              width: 0, height: 0,
            }}>
            {/* Beam line from center outward */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 0, height: pR - 14 }}>
              <div className={`h-full w-[3px] mx-auto rounded-full transition-all duration-300
                ${isActive
                  ? "bg-gradient-to-t from-amber-500/20 via-amber-400/60 to-amber-300"
                  : "bg-slate-600/30"}`} />
              {/* Arrow tip */}
              <div className={`absolute -top-1 left-1/2 -translate-x-1/2 transition-all duration-300
                ${isActive ? "opacity-100" : "opacity-40"}`}>
                <div className="h-0 w-0"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: `10px solid ${isActive ? "#fbbf24" : "#64748b"}`,
                  }} />
              </div>
            </div>
          </div>

          {/* Center dot */}
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rounded-full transition-all duration-300
            ${isActive
              ? "h-4 w-4 bg-amber-400 shadow-md shadow-amber-400/60"
              : "h-3 w-3 bg-slate-500"}`} />

          {/* Players around the circle */}
          {PLAYERS.map((p, i) => {
            const angle = (i * (360 / PLAYERS.length) - 90) * Math.PI / 180;
            const x = r + pR * Math.cos(angle);
            const y = r + pR * Math.sin(angle);
            const pointed = eenyPointer === i;
            return (
              <div key={p.name} className={`absolute flex flex-col items-center transition-all duration-200
                ${pointed ? "scale-130 z-20" : ""}`}
                style={{ left: x - 28, top: y - 28, width: 56, height: 56 }}>
                {/* Highlight ring when pointed */}
                {pointed && (
                  <div className="absolute -inset-1 rounded-full bg-amber-400/15 animate-pulse" />
                )}
                <div className={`rounded-full p-0.5 transition-all duration-200
                  ${pointed ? "ring-3 ring-amber-400 shadow-lg shadow-amber-400/40" : ""}`}>
                  <PlayerAvatar player={p} urls={avatarUrls} size="h-11 w-11" />
                </div>
                <span className={`text-[10px] font-bold mt-0.5 transition-colors
                  ${pointed ? "text-amber-300" : "text-white/70"}`}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* Pre-game: normal card grid */
  function renderCardSelect() {
    return (
      <div className="grid grid-cols-2 gap-2">
        {PLAYERS.map((p) => {
          const sel = selectedPlayer === p.name;
          return (
            <button key={p.name} type="button"
              onClick={() => { setSelectedPlayer(p.name); }}
              className={`relative rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 cursor-pointer active:scale-95
                ${sel ? "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20" : "border-slate-600 bg-slate-700/60 hover:border-slate-500"}`}>
              <div className="flex justify-center"><PlayerAvatar player={p} urls={avatarUrls} /></div>
              <div className="text-sm font-bold text-white mt-1">{p.name}</div>
              <div className="text-[10px] text-gray-400">{p.tagline}</div>
              {sel && <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] leading-4 text-black font-bold">✓</div>}
            </button>
          );
        })}
      </div>
    );
  }

  function renderGameAnimation() {
    switch (animType) {
      case "spin": return renderSpinWheel();
      case "dice": return renderDice();
      case "roulette": return renderRoulette();
      case "magic8": return renderMagic8();
      case "lightning": return renderLightning();
      case "eenymeeny": return renderEenyMeeny();
    }
  }

  /* ═══════ OTHER LOGIC ═══════ */

  async function runTrollProgress(): Promise<void> {
    setShowProgress(true);
    for (const s of [
      { value: 30, label: "Credentials checken...", delay: 400 },
      { value: 65, label: "Hmmm...", delay: 600 },
      { value: 92, label: "Bijna klaar...", delay: 800 },
      { value: 99, label: "Just nog efkes...", delay: 1000 },
      { value: 42, label: "Oeps, opnieuw...", delay: 600 },
      { value: 78, label: "Nu echt bijna...", delay: 500 },
      { value: 100, label: "LET'S GO! 🍺", delay: 300 },
    ]) {
      setProgressValue(s.value);
      setProgressLabel(s.label);
      await new Promise((r) => setTimeout(r, s.delay));
    }
    setShowProgress(false);
    setProgressValue(0);
  }

  function triggerShake() { setShaking(true); setTimeout(() => setShaking(false), 500); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = showAdminLogin && adminName ? adminName : selectedPlayer || (formData.get("name") as string);
    const pin = formData.get("pin") as string;

    if (!name) { setError(showGameLogin ? "Ge moet eerst spelen kerel!" : "Kies eerst uwe naam"); triggerShake(); return; }
    setError(null);
    setTrollMsg(null);

    const result = await validateLogin(name, pin);
    if (!result.valid) { setError("Verkeerde PIN of naam, probeer opnieuw"); triggerShake(); return; }

    if (gameActive && !result.isAdmin && !trolled && Math.random() < 0.3) {
      setTrollMsg(TROLL_MESSAGES[Math.floor(Math.random() * TROLL_MESSAGES.length)]);
      setTrolled(true);
      const pinInput = form.querySelector('input[name="pin"]') as HTMLInputElement;
      if (pinInput) pinInput.value = "";
      return;
    }

    if (gameActive && !result.isAdmin && Math.random() < 0.4) await runTrollProgress();

    setLoggingIn(true);
    const loginData = new FormData();
    loginData.set("name", name);
    loginData.set("pin", pin);
    await login(loginData);
  }

  const animInfo = ANIMATION_LABELS[animType];
  const showGameLogin = gameActive && useGameLogin;

  /* ═══════ RENDER ═══════ */
  if (loggingIn) {
    return (
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-8 animate-fadeIn">
          <div className="text-4xl animate-bounce">🌞</div>
          <p className="text-lg font-bold text-white">Bezig met inloggen...</p>
          <p className="text-sm text-gray-400 italic">Even geduld kameraad</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`login-card relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur ${shaking ? "animate-shake" : ""}`}>
      <h1 className="mb-1 text-center text-3xl font-extrabold text-white">
        <span className={`inline-block select-none ${gameActive ? "cursor-pointer" : ""}`} onClick={gameActive ? handleBeerTap : undefined}>🍺</span>{" "}
        Tenerife 2026
      </h1>
      {gameActive && <p className="mb-6 text-center text-sm text-gray-400 italic">{subtitle}</p>}
      {!gameActive && <p className="mb-6 text-center text-sm text-gray-400">Log in om verder te gaan</p>}

      {trollMsg && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-center text-sm text-amber-300 animate-fadeIn">{trollMsg}</div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-300 animate-fadeIn">{error}</div>
      )}
      {showProgress && (
        <div className="mb-4 animate-fadeIn">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${progressValue}%` }} />
          </div>
          <p className="mt-1 text-center text-xs text-gray-400">{progressLabel}</p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {!showAdminLogin && (
          <div>
            {/* ── GAME LOGIN: INTRO ── */}
            {showGameLogin && phase === "intro" && (
              <div className="animate-fadeIn text-center">
                <div className="mb-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
                  <p className="text-2xl font-extrabold text-amber-400 mb-2">{introMsg.title}</p>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{introMsg.body}</p>
                </div>
                <button type="button" onClick={() => setPhase("ready")}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 font-bold text-black transition hover:from-amber-400 hover:to-orange-400 active:scale-95">
                  Lets go nigga
                </button>
              </div>
            )}

            {/* ── GAME LOGIN: READY / ANIMATING ── */}
            {showGameLogin && (phase === "ready" || phase === "animating") && (
              <>
                <label className="mb-3 block text-sm font-medium text-gray-300 text-center">
                  {animInfo.label}
                </label>
                {renderGameAnimation()}
                <button type="button" onClick={handlePlay} disabled={phase === "animating"}
                  className={`mt-4 w-full rounded-lg py-2.5 font-bold text-black transition
                    ${phase === "animating" ? "bg-gray-500 cursor-wait" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95"}`}>
                  {phase === "animating" ? animInfo.activeButton : animInfo.button}
                </button>
              </>
            )}

            {/* ── GAME LOGIN: RESULT ── */}
            {showGameLogin && phase === "result" && selectedPlayer && (
              <div className="animate-fadeIn">
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-green-500/40 bg-green-500/10 p-5 mb-3">
                  <p className="text-green-300 text-sm font-bold">{resultMessage}</p>
                  <PlayerAvatar player={PLAYERS.find(p => p.name === selectedPlayer)!} urls={avatarUrls} size="h-20 w-20" />
                  <p className="text-white text-xl font-extrabold">{selectedPlayer}</p>
                  <p className="text-[11px] text-gray-400">{PLAYERS.find(p => p.name === selectedPlayer)?.tagline}</p>
                </div>
                <button type="button" onClick={handlePlayAgain}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 text-sm font-medium text-gray-300 transition hover:bg-slate-600 active:scale-95">
                  Geen geluk, probeert nog ne keer x
                </button>
              </div>
            )}

            {/* ── REGULAR LOGIN (before game / 55% during game) ── */}
            {!showGameLogin && (
              <>
                <label className="mb-1 block text-sm font-medium text-gray-300">Wie zijde gij?</label>
                {gameActive ? (
                  <>
                    <label className="mb-3 block text-sm font-medium text-gray-300 text-center">Wie zijde gij?</label>
                    {renderCardSelect()}
                  </>
                ) : (
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Kiest uwe naam</option>
                    {PLAYERS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                    {ADMINS.map((a) => <option key={a.name} value={a.name}>{a.label}</option>)}
                  </select>
                )}
              </>
            )}

            <input type="hidden" name="name" value={selectedPlayer} />
          </div>
        )}

        {showAdminLogin && (
          <div className="animate-fadeIn">
            <label className="mb-1 block text-sm font-medium text-gray-300">🤫 Geheime login</label>
            <select value={adminName} onChange={(e) => { setAdminName(e.target.value); setSelectedPlayer(e.target.value); }}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Kiest uwe naam</option>
              {PLAYERS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              {ADMINS.map((a) => <option key={a.name} value={a.name}>{a.label} (Admin)</option>)}
            </select>
            <button type="button" onClick={() => { setShowAdminLogin(false); setAdminName(""); }} className="mt-1 text-xs text-gray-500 hover:text-gray-400">
              ← Terug naar normaal
            </button>
          </div>
        )}

        {/* PIN + submit — hidden during intro phase of game login */}
        {(showAdminLogin || !showGameLogin || phase !== "intro") && (
          <>
            <div>
              <label htmlFor="pin" className="mb-1 block text-sm font-medium text-gray-300">Geheime code</label>
              <input type="password" name="pin" id="pin" inputMode="numeric" maxLength={4} required placeholder="PIN code, nu!"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <button type="submit" className="animate-buttonGlow w-full rounded-lg bg-amber-500 py-2.5 font-bold text-black transition hover:bg-amber-400 active:scale-95">
              HUTS!
            </button>
          </>
        )}
      </form>

      {gameActive && !showAdminLogin && (
        <p className="mt-3 text-center text-[10px] text-slate-600 select-none">🍺 × {beerTaps}/5</p>
      )}
    </div>
  );
}
