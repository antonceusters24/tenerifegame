import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "memes");

  try {
    const allFiles = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i.test(f));

    // Return full list of files for client-side shuffle queue
    const files = allFiles.map((f) => ({
      src: `/memes/${encodeURIComponent(f)}`,
      type: /\.(mp4|mov|webm)$/i.test(f) ? "video" : ("image" as const),
    }));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
