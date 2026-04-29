"use client";

import { useState, useEffect, useRef } from "react";

export default function RandomImage({ className = "" }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("image");
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/random-image")
      .then((r) => r.json())
      .then((d) => {
        if (d.src) {
          setSrc(d.src);
          setType(d.type || "image");
        }
      })
      .catch(() => {});
  }, []);

  if (!src) return null;

  // Videos as full-screen fixed background with autoplay
  if (type === "video") {
    return (
      <div className="fixed inset-0 z-0" style={{ top: "140px", height: "calc(100dvh - 140px)" }}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted={muted}
          playsInline
          preload="auto"
          onError={() => {
            // If video fails, reload a new random media
            fetch("/api/random-image")
              .then((r) => r.json())
              .then((d) => {
                if (d.src) {
                  setSrc(d.src);
                  setType(d.type || "image");
                }
              })
              .catch(() => {});
          }}
          className="pointer-events-none h-full w-full object-contain"
          style={{ backgroundColor: "#0f172a" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-slate-950/60" />
        <button
          onClick={() => {
            setMuted(!muted);
            if (videoRef.current) videoRef.current.muted = !muted;
          }}
          style={{ position: "fixed", bottom: "120px", right: "16px", zIndex: 60 }}
          className="rounded-full bg-slate-800/80 p-2.5 text-xl shadow-lg transition active:scale-90"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    );
  }

  // Images as full-screen fixed background
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
      style={{ opacity: loaded ? 1 : 0, top: "140px", height: "calc(100dvh - 140px)", backgroundColor: "#0f172a" }}
    >
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        className="h-full w-full object-contain"
      />
      <div className="absolute inset-0 bg-slate-950/60" />
    </div>
  );
}
