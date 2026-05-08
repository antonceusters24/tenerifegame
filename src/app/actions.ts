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
    .select("id, name, role, pin_changed, emoji, avatar_url, is_banned")
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
    .from(getTable("confirmations"))
    .upsert({ assignment_id: assignmentId, confirmed_by: user.id }, { onConflict: "assignment_id,confirmed_by" });

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
  if (!["pending", "active"].includes(assignment.status)) return { error: "Not pending or active" };

  await supabase
    .from(getTable("assignments"))
    .update({ status: "active" })
    .eq("id", assignmentId);

  await supabase
    .from(getTable("confirmations"))
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
    .from(getTable("confirmations"))
    .delete()
    .eq("assignment_id", assignmentId);

  return { success: true };
}

export async function requestNewChallenge(day: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not logged in" };

  const supabase = await createClient();
  const challengesTable = getTable("challenges");
  const assignmentsTable = getTable("assignments");

  // Enforce daily limit: max 1 draw (= 2 challenges) per person per day
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

  // Get available challenges per category (not assigned to ANY player)
  // We need the category names to split into doe/gotcha
  let query = supabase.from(challengesTable).select("id, category_id, difficulty, requires_target, categories(name)");
  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }
  const { data: available } = await query;

  if (!available || available.length === 0) {
    return { error: "Geen challenges meer beschikbaar!" };
  }

  // Split by category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doeAvailable = available.filter((c: any) => {
    const name = c.categories?.name || "";
    return name.toLowerCase().includes("doe");
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gotchaAvailable = available.filter((c: any) => {
    const name = c.categories?.name || "";
    return name.toLowerCase().includes("gotcha");
  });

  if (doeAvailable.length === 0 || gotchaAvailable.length === 0) {
    return { error: "Niet genoeg challenges beschikbaar (minstens 1 doe + 1 gotcha nodig)" };
  }

  // Pick one random from each category
  const doeChallenge = doeAvailable[Math.floor(Math.random() * doeAvailable.length)];
  const gotchaChallenge = gotchaAvailable[Math.floor(Math.random() * gotchaAvailable.length)];

  // Assign target if needed
  const PLAYERS = ["Lander", "Berten", "Dries", "Anton"];
  const otherPlayers = PLAYERS.filter((p) => p !== user.name);

  let doeTarget: string | null = null;
  if (doeChallenge.requires_target) {
    doeTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  }

  let gotchaTarget: string | null = null;
  if (gotchaChallenge.requires_target) {
    gotchaTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  }

  // Insert both assignments
  const { error } = await supabase.from(assignmentsTable).insert([
    {
      user_id: user.id,
      challenge_id: doeChallenge.id,
      day,
      target_player_name: doeTarget,
    },
    {
      user_id: user.id,
      challenge_id: gotchaChallenge.id,
      day,
      target_player_name: gotchaTarget,
    },
  ]);

  if (error) return { error: `Failed to assign challenges: ${error.message}` };
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

// Chinese Fucking sessions - only Anton can manage
export async function addCFSession(scores: Record<string, number>, day: number) {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Alleen Anton mag dit" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cf_sessions")
    .insert({ scores, day })
    .select()
    .single();

  if (error) return { error: "Failed to add session" };
  return { success: true, session: data };
}

export async function deleteCFSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Alleen Anton mag dit" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cf_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { error: "Failed to delete session" };
  return { success: true };
}

// Admin ban/unban users — only Anton
export async function banUser(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_banned: true })
    .eq("id", userId)
    .neq("name", "Anton"); // Can't ban yourself

  if (error) return { error: "Failed to ban user" };
  return { success: true };
}

export async function unbanUser(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_banned: false })
    .eq("id", userId);

  if (error) return { error: "Failed to unban user" };
  return { success: true };
}

export async function getBannedUsers() {
  const user = await getCurrentUser();
  if (!user || user.name !== "Anton") return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, is_banned")
    .eq("role", "player")
    .order("name");

  return { users: data || [] };
}
