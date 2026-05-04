// Run with: node scripts/seed-test-challenges.mjs
// Inserts test challenges into challenges_test table for the preview environment.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vsujrjqmwnmxpjdrjzqd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdWpyanFtd25teHBqZHJqenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDA5NjAsImV4cCI6MjA5MjkxNjk2MH0.REXs9QvRqMsQcfAgP6YEVySG4CL82unBSstd2nkNqPM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch categories
const { data: cats, error: catErr } = await supabase
  .from("categories")
  .select("id, name");

if (catErr || !cats?.length) {
  console.error("Could not fetch categories:", catErr?.message);
  process.exit(1);
}

console.log("Found categories:", cats.map((c) => `${c.name} (${c.id})`).join(", "));

function cat(name) {
  const found = cats.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
  if (!found) throw new Error(`Category not found: ${name}`);
  return found.id;
}

const challenges = [
  // Gotcha challenges (requires_target: true)
  { title: "Zwembad", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "easy", points: 5, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Paella", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "easy", points: 5, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Kokosnoot", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "medium", points: 10, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Zonnebrand", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "medium", points: 10, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Vliegtuig", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "hard", points: 20, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Snorkel", description: 'Laat de persoon die wordt aangewezen dit woord zeggen. Als dit lukt, roep je "Gotchaaa" en krijgt ge uw punten.', difficulty: "easy", points: 5, category: "Gotcha", requires_target: true, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },

  // Doe opdracht challenges
  { title: "Dansje op de bar", description: "Doe een dansje op de bar van minstens 15 seconden. Video bewijs vereist.", difficulty: "hard", points: 20, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: "Doe het langer dan 30 seconden", bonus_points: 10 },
  { title: "Compliment aan stranger", description: "Geef een compliment in het Spaans aan een willekeurige vreemde. Laat iemand filmen.", difficulty: "easy", points: 5, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Zwemmen om middernacht", description: "Spring in het zwembad na middernacht. Getuigen vereist.", difficulty: "medium", points: 10, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: "Doe het in uw kleren", bonus_points: 5 },
  { title: "Eet iets raars", description: "Bestel iets op het menu dat ge normaal nooit zou eten en eet het volledig op.", difficulty: "medium", points: 10, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Selfie met politie", description: "Maak een selfie met een lokale politieagent.", difficulty: "hard", points: 20, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: "Laat de agent ook een duimpje omhoog doen", bonus_points: 10 },
  { title: "Strandloper", description: "Loop 500m op het strand op blote voeten en kom terug. Iemand timed u.", difficulty: "easy", points: 5, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Cocktail shaken", description: "Vraag aan de barman of ge zelf uw cocktail moogt shaken.", difficulty: "medium", points: 10, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: "Drink hem in één keer op", bonus_points: 5 },
  { title: "Karaoke duet", description: "Zing een duet met een random persoon in een bar.", difficulty: "hard", points: 20, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Ijskoud water", description: "Drink een glas ijskoud water in minder dan 5 seconden zonder te stoppen.", difficulty: "easy", points: 5, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: null, bonus_points: 0 },
  { title: "Pushups challenge", description: "Doe 20 pushups op het strand of aan het zwembad. Getuigen vereist.", difficulty: "medium", points: 10, category: "Doe opdracht", requires_target: false, created_by_admin: "Test", bonus_description: "Doe er 40", bonus_points: 10 },
];

const rows = challenges.map((c) => ({
  title: c.title,
  description: c.description,
  difficulty: c.difficulty,
  points: c.points,
  category_id: cat(c.category),
  requires_target: c.requires_target,
  created_by_admin: c.created_by_admin,
  bonus_description: c.bonus_description,
  bonus_points: c.bonus_points,
}));

const { data, error } = await supabase
  .from("challenges_test")
  .insert(rows)
  .select("id, title");

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log(`\n✅ Inserted ${data.length} test challenges:`);
data.forEach((c) => console.log(`  - ${c.title} (${c.id})`));
