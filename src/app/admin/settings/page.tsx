import { redirect } from "next/navigation";
import { getCurrentUser } from "../../actions";
import { createClient } from "@/lib/supabase-server";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.name !== "Anton") redirect("/dashboard");

  const supabase = await createClient();
  const { data: players } = await supabase
    .from("users")
    .select("id, name, is_banned")
    .eq("role", "player")
    .order("name");

  return <AdminSettingsClient user={user} players={players || []} />;
}
