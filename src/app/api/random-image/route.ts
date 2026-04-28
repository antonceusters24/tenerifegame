import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "memes");

  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i.test(f));

    if (files.length === 0) {
      return NextResponse.json({ src: null, type: "image" });
    }

    const random = files[Math.floor(Math.random() * files.length)];
    const isVideo = /\.(mp4|mov|webm)$/i.test(random);
    return NextResponse.json({
      src: `/memes/${encodeURIComponent(random)}`,
      type: isVideo ? "video" : "image",
    });
  } catch {
    return NextResponse.json({ src: null, type: "image" });
  }
}
