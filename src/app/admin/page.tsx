import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";
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
    .from(getTable("challenges"))
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  // Get admin names for the creator dropdown
  const { data: admins } = await supabase
    .from("users")
    .select("name")
    .eq("role", "admin");

  const adminNames = (admins || []).map((a) => a.name.replace(" (Admin)", ""));

  return (
    <AdminClient
      user={user}
      categories={categories || []}
      challenges={challenges || []}
      adminNames={adminNames}
    />
  );
}
