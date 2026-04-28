"use client";

import { useState, useRef } from "react";
import { User } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Photo = {
  id: string;
  user_id: string;
  user_name: string;
  file_path: string;
  caption: string | null;
  created_at: string;
};

export default function GalleryClient({
  user,
  photos,
  supabaseUrl,
}: {
  user: User;
  photos: Photo[];
  supabaseUrl: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function getPhotoUrl(filePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/photos/${filePath}`;
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (caption.trim()) formData.append("caption", caption.trim());

    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setCaption("");
        setShowUpload(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Upload mislukt");
      }
    } catch {
      alert("Upload mislukt, check uw internet");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(photo: Photo) {
    const url = getPhotoUrl(photo.file_path);
    // On iOS Safari, window.open works better than download attribute
    // We fetch as blob and open in new tab for maximum compatibility
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `tenerife-${photo.user_name}-${photo.id.slice(0, 6)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: open in new tab (iOS user can long-press to save)
      window.open(url, "_blank");
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("nl-BE", { month: "short" });
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${day} ${month} ${hours}:${mins}`;
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Terug
          </Link>
          <h1 className="text-lg font-bold text-white">📸 Galerij</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              showUpload
                ? "bg-amber-500 text-black"
                : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
            }`}
          >
            {showUpload ? "✕" : "＋ Foto"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Upload section */}
        {showUpload && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-slate-800/80 p-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="mb-3 w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-400"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optioneel)..."
              maxLength={200}
              className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 active:scale-95 disabled:opacity-50"
            >
              {uploading ? "⏳ Uploaden..." : "📤 Upload"}
            </button>
          </div>
        )}

        {/* Photo count */}
        <p className="mb-3 text-sm text-gray-400">
          {photos.length} foto{photos.length !== 1 ? "'s" : ""} gedeeld
        </p>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-8 text-center">
            <p className="text-4xl">📷</p>
            <p className="mt-2 text-gray-400">
              Nog geen foto&apos;s geüpload
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Wees de eerste legend die iets deelt!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800 transition active:scale-95"
              >
                <div className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.caption || "Photo"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                  <p className="text-xs font-bold text-white">
                    {photo.user_name}
                  </p>
                  {photo.caption && (
                    <p className="truncate text-xs text-gray-300">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen photo viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">
                {selectedPhoto.user_name}
              </p>
              <p className="text-xs text-gray-400">
                {formatTime(selectedPhoto.created_at)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white"
            >
              ✕
            </button>
          </div>

          {/* Image */}
          <div
            className="flex flex-1 items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPhotoUrl(selectedPhoto.file_path)}
              alt={selectedPhoto.caption || "Photo"}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>

          {/* Bottom bar */}
          <div className="px-4 pb-8 pt-3">
            {selectedPhoto.caption && (
              <p className="mb-3 text-center text-sm text-gray-300">
                {selectedPhoto.caption}
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(selectedPhoto);
              }}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition active:scale-95"
            >
              📥 Download foto
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              iPhone: houd foto ingedrukt → &quot;Bewaar afbeelding&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
