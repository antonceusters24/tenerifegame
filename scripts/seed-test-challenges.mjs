// Run with: node scripts/seed-test-challenges.mjs
// Resets and re-seeds challenges_test + assignments_test for testing the balanced assignment algorithm.
// Creates 24 Gotcha + 24 Doe opdracht = 48 test challenges.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vsujrjqmwnmxpjdrjzqd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdWpyanFtd25teHBqZHJqenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDA5NjAsImV4cCI6MjA5MjkxNjk2MH0.REXs9QvRqMsQcfAgP6YEVySG4CL82unBSstd2nkNqPM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CLEANUP ---
console.log("🧹 Cleaning up assignments_test...");
const { error: delAssign } = await supabase.from("assignments_test").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (delAssign) console.warn("  ⚠️ assignments_test cleanup:", delAssign.message);
else console.log("  ✅ assignments_test cleared");

console.log("🧹 Cleaning up challenges_test...");
const { error: delChal } = await supabase.from("challenges_test").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (delChal) console.warn("  ⚠️ challenges_test cleanup:", delChal.message);
else console.log("  ✅ challenges_test cleared");

// --- FETCH CATEGORIES ---
const { data: cats, error: catErr } = await supabase.from("categories").select("id, name");
if (catErr || !cats?.length) {
  console.error("Could not fetch categories:", catErr?.message);
  process.exit(1);
}
console.log("\nFound categories:", cats.map((c) => `${c.name} (${c.id})`).join(", "));

function cat(name) {
  const found = cats.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
  if (!found) throw new Error(`Category not found: ${name}`);
  return found.id;
}

// --- GENERATE 24 GOTCHA + 24 DOE CHALLENGES ---
const GOTCHA_WORDS = [
  "Zwembad", "Paella", "Kokosnoot", "Zonnebrand", "Vliegtuig", "Snorkel",
  "Sangria", "Vulkaan", "Papegaai", "Banaan", "Flipflop", "Handdoek",
  "Ananas", "Jetski", "Surfplank", "Cocktail", "Palmboom", "Dolfijn",
  "Bikini", "Zonsondergang", "Kameleon", "Hagedis", "Cactus", "Woestijn",
];

const DOE_TITLES = [
  "Dansje op de bar", "Compliment aan stranger", "Zwemmen om middernacht",
  "Eet iets raars", "Selfie met politie", "Strandloper",
  "Cocktail shaken", "Karaoke duet", "Ijskoud water", "Pushups challenge",
  "Zonnecrème aanbieden", "Spaans bestellen", "Foto met local",
  "Strandsprint", "Duik van de rots", "Arm wrestle challenge",
  "Shot roulette", "Bar trick", "Vreemde begroeting", "Limbo challenge",
  "Bierkapje", "Cocktail naam verzinnen", "Toerist spelen", "Dansen met stranger",
];

const DOE_DESCRIPTIONS = [
  "Doe een dansje op de bar van minstens 15 seconden.",
  "Geef een compliment in het Spaans aan een willekeurige vreemde.",
  "Spring in het zwembad na middernacht. Getuigen vereist.",
  "Bestel iets op het menu dat ge normaal nooit zou eten.",
  "Maak een selfie met een lokale politieagent.",
  "Loop 500m op het strand op blote voeten.",
  "Vraag aan de barman of ge zelf uw cocktail moogt shaken.",
  "Zing een duet met een random persoon in een bar.",
  "Drink een glas ijskoud water in minder dan 5 seconden.",
  "Doe 20 pushups op het strand of aan het zwembad.",
  "Bied zonnecrème aan bij een willekeurige toerist.",
  "Bestel uw volgende drankje volledig in het Spaans.",
  "Maak een foto met een local en post het in de groep.",
  "Sprint 100m over het strand. Iemand timed u.",
  "Spring van een rots (veilige hoogte!) in het water.",
  "Daag een random persoon uit voor arm wrestle.",
  "Doe een shot roulette met minstens 3 opties.",
  "Leer een bar trick en voer hem uit voor de groep.",
  "Begroet 5 vreemden op een rare manier.",
  "Organiseer een limbo met random mensen.",
  "Open een biertje met iets dat geen flesopener is.",
  "Verzin een cocktailnaam en laat de barman hem maken.",
  "Gedraag u 10 minuten als de ultieme toerist.",
  "Vraag een stranger om te dansen en dans minstens 30 sec.",
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const POINTS = { easy: 5, medium: 10, hard: 20 };

const challenges = [];

// 24 Gotcha challenges
for (let i = 0; i < 24; i++) {
  const diff = DIFFICULTIES[i % 3];
  challenges.push({
    title: GOTCHA_WORDS[i],
    description: `Laat de persoon die wordt aangewezen het woord "${GOTCHA_WORDS[i]}" zeggen. Als dit lukt, roep je "Gotchaaa!" en krijgt ge uw punten.`,
    difficulty: diff,
    points: POINTS[diff],
    category_id: cat("Gotcha"),
    requires_target: true,
    created_by_admin: "Test",
    bonus_description: i % 4 === 0 ? "Laat het woord 3x zeggen in 1 gesprek" : null,
    bonus_points: i % 4 === 0 ? 5 : 0,
  });
}

// 24 Doe opdracht challenges
for (let i = 0; i < 24; i++) {
  const diff = DIFFICULTIES[i % 3];
  challenges.push({
    title: DOE_TITLES[i],
    description: DOE_DESCRIPTIONS[i],
    difficulty: diff,
    points: POINTS[diff],
    category_id: cat("Doe"),
    requires_target: false,
    created_by_admin: "Test",
    bonus_description: i % 3 === 0 ? "Doe het met meer inzet dan verwacht" : null,
    bonus_points: i % 3 === 0 ? 5 : 0,
  });
}

// --- INSERT ---
const { data, error } = await supabase.from("challenges_test").insert(challenges).select("id, title, category_id");

if (error) {
  console.error("\n❌ Insert failed:", error.message);
  process.exit(1);
}

const gotchaCount = data.filter((c) => c.category_id === cat("Gotcha")).length;
const doeCount = data.filter((c) => c.category_id === cat("Doe")).length;

console.log(`\n✅ Inserted ${data.length} test challenges:`);
console.log(`   Gotcha: ${gotchaCount}`);
console.log(`   Doe opdracht: ${doeCount}`);
console.log("\nReady to test the assignment algorithm!");
