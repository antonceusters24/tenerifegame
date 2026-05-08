import LoginClient from "./LoginClient";
import { createClient } from "@/lib/supabase-server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("role", "player");

  const avatarUrls: Record<string, string> = {};
  if (players) {
    for (const p of players) {
      if (p.avatar_url) avatarUrls[p.name] = p.avatar_url;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start pt-[8vh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <LoginClient avatarUrls={avatarUrls} />
    </div>
  );
}
