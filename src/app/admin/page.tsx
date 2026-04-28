import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");
  if (!user.pin_changed) redirect("/change-pin");

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: challenges } = await supabase
    .from("challenges")
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  return (
    <AdminClient
      user={user}
      categories={categories || []}
      challenges={challenges || []}
    />
  );
}
