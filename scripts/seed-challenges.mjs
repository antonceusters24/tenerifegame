// Run with: node scripts/seed-challenges.mjs
// Inserts 10 test challenges across existing categories.
// First fetches category IDs from the DB so the script works regardless of UUID order.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vsujrjqmwnmxpjdrjzqd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdWpyanFtd25teHBqZHJqenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDA5NjAsImV4cCI6MjA5MjkxNjk2MH0.REXs9QvRqMsQcfAgP6YEVySG4CL82unBSstd2nkNqPM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch categories first so we use real IDs
const { data: cats, error: catErr } = await supabase
  .from("categories")
  .select("id, name");

if (catErr || !cats?.length) {
  console.error("Could not fetch categories:", catErr?.message);
  process.exit(1);
}

console.log(
  "Found categories:",
  cats.map((c) => `${c.name} (${c.id})`).join(", ")
);

// Helper: find category ID by partial name match (case-insensitive)
function cat(name) {
  const found = cats.find((c) =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );
  if (!found) throw new Error(`Category not found: ${name}`);
  return found.id;
}

const challenges = [
  // Gotcha (requires_target: true)
  {
    title: "Sportpaleis",
    description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.',
    difficulty: "easy", points: 10, category: "Gotcha", requires_target: true,
  },
  {
    title: "Tenerife",
    description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.',
    difficulty: "easy", points: 10, category: "Gotcha", requires_target: true,
  },
  {
    title: "Bongobar",
    description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.',
    difficulty: "medium", points: 15, category: "Gotcha", requires_target: true,
  },
  {
    title: "Flamingo",
    description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.',
    difficulty: "medium", points: 15, category: "Gotcha", requires_target: true,
  },

  // Doe opdracht
  {
    title: "Eerste rondje",
    description: "Koop een rondje voor de hele groep zonder dat iemand het vraagt.",
    difficulty: "easy", points: 15, category: "Doe opdracht", requires_target: false,
  },
  {
    title: "Foto met een local",
    description: "Maak een foto met een willekeurige local en laat hem/haar zeggen wat zijn favoriete strand is.",
    difficulty: "medium", points: 20, category: "Doe opdracht", requires_target: false,
  },
  {
    title: "Blind proeven",
    description: "Laat iemand je een drankje inschenken zonder te kijken. Ge moet raden wat het is.",
    difficulty: "medium", points: 20, category: "Doe opdracht", requires_target: false,
  },
  {
    title: "Shot-roulette",
    description: "Doe 3 shots op rij zonder grimassen te trekken. Getuigen vereist.",
    difficulty: "hard", points: 30, category: "Doe opdracht", requires_target: false,
  },
  {
    title: "Strandsprint",
    description: "Sprint 100 meter op het strand zo snel als ge kunt. Iemand timed u.",
    difficulty: "easy", points: 15, category: "Doe opdracht", requires_target: false,
  },
  {
    title: "Karaoke solo",
    description: "Zing een volledig liedje solo voor de groep. Ge kiest zelf welk.",
    difficulty: "hard", points: 35, category: "Doe opdracht", requires_target: false,
  },
];

const rows = challenges.map((c) => ({
  title: c.title,
  description: c.description,
  difficulty: c.difficulty,
  points: c.points,
  category_id: cat(c.category),
  requires_target: c.requires_target,
}));

const { data, error } = await supabase
  .from("challenges")
  .insert(rows)
  .select("id, title");

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log(`\n✅ Inserted ${data.length} challenges:`);
data.forEach((c) => console.log(`  - ${c.title} (${c.id})`));
