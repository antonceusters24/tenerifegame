export type User = {
  id: string;
  name: string;
  role: "player" | "admin";
  pin_changed: boolean;
  emoji: string;
  avatar_url: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
};

export type Challenge = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  categories?: Category;
};

export type Assignment = {
  id: string;
  user_id: string;
  challenge_id: string;
  day: number;
  status: "active" | "pending" | "completed" | "skipped";
  assigned_at: string;
  completed_at: string | null;
  target_player_name: string | null;
  challenges?: Challenge;
};

export type PendingConfirmation = {
  id: string;
  user_id: string;
  day: number;
  status: string;
  challenges: { title: string; description: string; points: number; difficulty: string; categories: { name: string } | null } | null;
  users: { name: string } | null;
};

export type ScoreboardEntry = {
  user_id: string;
  name: string;
  earned_points: number;
  penalty_points: number;
  total_points: number;
  completed_count: number;
  skipped_count: number;
  pending_count: number;
};
