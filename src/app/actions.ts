"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";

export async function validateLogin(
  name: string,
  pin: string
): Promise<{ valid: boolean; isAdmin: boolean }> {
  if (!name || !pin) return { valid: false, isAdmin: false };

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("name", name)
    .eq("pin", pin)
    .single();

  if (error || !user) return { valid: false, isAdmin: false };
  return { valid: true, isAdmin: user.role === "admin" };
}

export async function login(formData: FormData) {
  const name = formData.get("name") as string;
  const pin = formData.get("pin") as string;

  if (!name || !pin) {
    redirect("/?error=missing");
  }

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, role, pin_changed, emoji, avatar_url")
    .eq("name", name)
    .eq("pin", pin)
    .single();

  if (error || !user) {
    redirect("/?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });

  if (!user.pin_changed) {
    redirect("/change-pin");
  }

  if (user.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_id");
  redirect("/");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, role, pin_changed, emoji, avatar_url")
    .eq("id", userId)
    .single();

  return data;
}

export async function changePin(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const newPin = formData.get("new_pin") as string;
  const confirmPin = formData.get("confirm_pin") as string;

  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { error: "PIN must be exactly 4 digits" };
  }

  if (newPin !== confirmPin) {
    return { error: "PINs don't match" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ pin: newPin, pin_changed: true })
    .eq("id", user.id);

  if (error) return { error: "Failed to update PIN" };

  if (user.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

export async function updateEmoji(emoji: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };

  // Basic validation - must be 1-4 characters (emoji can be multi-codepoint)
  if (!emoji || emoji.length > 8) return { error: "Invalid emoji" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ emoji, avatar_url: null })
    .eq("id", user.id);

  if (error) return { error: "Failed to update emoji" };
  return { success: true };
}

// Player marks challenge as done → goes to "pending" (needs Anton's confirmation)
// If the player IS Anton, auto-confirm (he's the game leader)
export async function completeChallenge(assignmentId: string, bonusCompleted: boolean = false) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };

  const supabase = await createClient();
  const newStatus = user.name === "Anton" ? "completed" : "pending";
  const { error } = await supabase
    .from(getTable("assignments"))
    .update({
      status: newStatus,
      bonus_completed: bonusCompleted,
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { error: "Failed to submit challenge" };
  return { success: true };
}

// Only Anton (game leader) can confirm challenges
export async function confirmChallenge(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };
  if (user.name !== "Anton")
    return { error: "Only Anton can confirm challenges" };

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from(getTable("assignments"))
    .select("user_id, status")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return { error: "Assignment not found" };
  if (assignment.user_id === user.id)
    return { error: "Can't confirm your own challenge, nice try 😏" };
  if (assignment.status !== "pending") return { error: "Not pending" };

  const { error: confError } = await supabase
    .from("confirmations")
    .upsert({ assignment_id: assignmentId, confirmed_by: user.id }, { onConflict: "assignment_id" });

  if (confError) return { error: confError.message };

  await supabase
    .from(getTable("assignments"))
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", assignmentId);

  return { success: true };
}

// Only Anton (game leader) can reject challenges
export async function rejectChallenge(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };
  if (user.name !== "Anton")
    return { error: "Only Anton can reject challenges" };

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from(getTable("assignments"))
    .select("user_id, status")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return { error: "Assignment not found" };
  if (assignment.user_id === user.id)
    return { error: "Can't reject your own challenge" };
  if (assignment.status !== "pending") return { error: "Not pending" };

  await supabase
    .from(getTable("assignments"))
    .update({ status: "active" })
    .eq("id", assignmentId);

  await supabase
    .from("confirmations")
    .delete()
    .eq("assignment_id", assignmentId);

  return { success: true };
}

// Undo an accidental confirm — sets back to active (or pending if player has another active)
export async function undoConfirmChallenge(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };
  if (user.name !== "Anton")
    return { error: "Only Anton can undo confirmations" };

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from(getTable("assignments"))
    .select("user_id, status")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return { error: "Assignment not found" };
  if (assignment.status !== "completed") return { error: "Not completed" };

  // Check if player already has an active challenge
  const { data: activeOnes } = await supabase
    .from(getTable("assignments"))
    .select("id")
    .eq("user_id", assignment.user_id)
    .in("status", ["active", "pending"])
    .limit(1);

  const newStatus = activeOnes && activeOnes.length > 0 ? "active" : "active";
  // Always set to active — the player's current active one stays; 
  // having 2 active is fine, the UI handles showing the oldest first

  await supabase
    .from(getTable("assignments"))
    .update({ status: newStatus, completed_at: null, bonus_completed: false })
    .eq("id", assignmentId);

  // Remove confirmation record
  await supabase
    .from("confirmations")
    .delete()
    .eq("assignment_id", assignmentId);

  return { success: true };
}

export async function skipChallenge(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };

  const supabase = await createClient();
  const { error } = await supabase
    .from(getTable("assignments"))
    .update({ status: "skipped", completed_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { error: "Failed to skip challenge" };
  return { success: true };
}

export async function requestNewChallenge(day: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };

  const supabase = await createClient();
  const challengesTable = getTable("challenges");
  const assignmentsTable = getTable("assignments");

  // Enforce daily limit: max 2 challenges per person per day
  const { count: todayCount } = await supabase
    .from(assignmentsTable)
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("day", day);

  if ((todayCount ?? 0) >= 2) {
    return { error: "Daily limit reached" };
  }

  // Get ALL assigned challenge IDs across ALL players (global uniqueness)
  const { data: allAssigned } = await supabase
    .from(assignmentsTable)
    .select("challenge_id");

  const usedIds = (allAssigned || []).map((a) => a.challenge_id);

  // Get category distribution for today (all players)
  const { data: todayAssignments } = await supabase
    .from(assignmentsTable)
    .select(`challenge_id, ${challengesTable}(category_id)`)
    .eq("day", day);

  const categoryCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (todayAssignments || []).forEach((a: any) => {
    const nested = a[challengesTable] || a.challenges;
    const catId = nested?.category_id;
    if (catId) {
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    }
  });

  // Get available challenges (not assigned to ANY player)
  let query = supabase.from(challengesTable).select("id, category_id, requires_target");
  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }
  const { data: available } = await query;

  if (!available || available.length === 0) {
    return { error: "No more challenges available!" };
  }

  // Prefer categories with fewer than 2 players today
  const preferred = available.filter(
    (c) => (categoryCounts[c.category_id] || 0) < 2
  );

  const pool = preferred.length > 0 ? preferred : available;
  const random = pool[Math.floor(Math.random() * pool.length)];

  // If challenge requires a target, pick a random other player
  let targetPlayerName: string | null = null;
  if (random.requires_target) {
    const PLAYERS = ["Lander", "Berten", "Dries", "Anton"];
    const otherPlayers = PLAYERS.filter((p) => p !== user.name);
    targetPlayerName = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  }

  const { error } = await supabase.from(assignmentsTable).insert({
    user_id: user.id,
    challenge_id: random.id,
    day,
    target_player_name: targetPlayerName,
  });

  if (error) return { error: "Failed to assign challenge" };
  return { success: true };
}

// Admin actions
export async function addChallenge(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Unauthorized" };

  const supabase = await createClient();
  const bonusPoints = parseInt(formData.get("bonus_points") as string) || 0;
  const { error } = await supabase.from(getTable("challenges")).insert({
    category_id: formData.get("category_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    difficulty: formData.get("difficulty") as string,
    points: parseInt(formData.get("points") as string) || 10,
    requires_target: formData.get("requires_target") === "true",
    created_by_admin: (formData.get("created_by_admin") as string) || user.name.replace(" (Admin)", ""),
    bonus_description: (formData.get("bonus_description") as string) || null,
    bonus_points: bonusPoints,
  });

  if (error) return { error: "Failed to add challenge" };
  return { success: true };
}

export async function updateChallenge(challengeId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Unauthorized" };

  const supabase = await createClient();
  const bonusPoints = parseInt(formData.get("bonus_points") as string) || 0;
  const { error } = await supabase
    .from(getTable("challenges"))
    .update({
      category_id: formData.get("category_id") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      difficulty: formData.get("difficulty") as string,
      points: parseInt(formData.get("points") as string) || 10,
      requires_target: formData.get("requires_target") === "true",
      created_by_admin: (formData.get("created_by_admin") as string) || null,
      bonus_description: (formData.get("bonus_description") as string) || null,
      bonus_points: bonusPoints,
    })
    .eq("id", challengeId);

  if (error) return { error: "Failed to update challenge" };
  return { success: true };
}

export async function deleteChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from(getTable("challenges"))
    .delete()
    .eq("id", challengeId);

  if (error) return { error: "Failed to delete challenge" };
  return { success: true };
}

// Chinese Fucking scoreboard - only Anton can update
export async function updateChineseFuckingScore(
  playerName: string,
  field: "wins" | "points",
  delta: number
) {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Alleen Anton mag dit" };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("chinese_fucking_scores")
    .select("*")
    .eq("player_name", playerName)
    .single();

  if (!current) return { error: "Player not found" };

  const newValue = Math.max(0, (current[field] || 0) + delta);
  const { error } = await supabase
    .from("chinese_fucking_scores")
    .update({ [field]: newValue })
    .eq("player_name", playerName);

  if (error) return { error: "Failed to update" };
  return { success: true };
}
