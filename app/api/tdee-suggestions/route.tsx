import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Guard: API key must exist ──────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      console.error("[tdee-suggestions] GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
    const body = await req.json();
    const { bmi, weight, height, age, gender, tdee, bmr, activityKey } = body;

    // ── 3. Use gemini-2.5-flash with thinking disabled for speed ──────────
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        // @ts-ignore — thinkingConfig is supported but not yet typed in older SDK versions
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are an expert fitness and nutrition AI.
Respond ONLY with valid JSON — no markdown fences, no explanation, no extra text whatsoever.

User: BMI ${bmi}, Weight ${weight}kg, Height ${height}cm, Age ${age}, Gender ${gender}, BMR ${bmr} cal, TDEE ${tdee} cal, Activity: ${activityKey}

Return EXACTLY this JSON structure (all 6 suggestions required):
{
  "recommendedGoal": "cut",
  "goalSummary": "one sentence why this goal fits",
  "suggestions": [
    {"id":"goal","tag":"Goal","tagColor":"bg-violet-500/20 text-violet-300 border-violet-500/30","title":"...","subtitle":"...","chips":[{"label":"Your TDEE","value":"${tdee} cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"Target","value":"... cal","color":"bg-violet-500/20 text-violet-300 border-violet-500/30"},{"label":"Difference","value":"... cal","color":"bg-rose-500/20 text-rose-300 border-rose-500/30"}],"tips":["tip1","tip2","tip3","tip4","tip5"]},
    {"id":"calories","tag":"Calories","tagColor":"bg-orange-500/20 text-orange-300 border-orange-500/30","title":"...","subtitle":"...","chips":[{"label":"BMR","value":"${bmr} cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"TDEE","value":"${tdee} cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"Weekly burn","value":"... cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"}],"tips":["tip1","tip2","tip3","tip4","tip5","tip6","tip7"]},
    {"id":"macros","tag":"Macros","tagColor":"bg-sky-500/20 text-sky-300 border-sky-500/30","title":"...","subtitle":"...","chips":[{"label":"Protein","value":"...g/day","color":"bg-red-500/20 text-red-300 border-red-500/30"},{"label":"Fat","value":"...g/day","color":"bg-yellow-500/20 text-yellow-300 border-yellow-500/30"},{"label":"Carbs","value":"...g/day","color":"bg-green-500/20 text-green-300 border-green-500/30"}],"tips":["tip1","tip2","tip3","tip4","tip5","tip6","tip7"]},
    {"id":"activity","tag":"Activity","tagColor":"bg-emerald-500/20 text-emerald-300 border-emerald-500/30","title":"...","subtitle":"...","chips":[{"label":"Current TDEE","value":"${tdee} cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"Multiplier","value":"...","color":"bg-neutral-800 text-neutral-300 border-neutral-700"}],"tips":["tip1","tip2","tip3","tip4","tip5"]},
    {"id":"meal-timing","tag":"Meal Timing","tagColor":"bg-amber-500/20 text-amber-300 border-amber-500/30","title":"...","subtitle":"...","chips":[{"label":"Per meal","value":"... cal","color":"bg-amber-500/20 text-amber-300 border-amber-500/30"},{"label":"Per snack","value":"... cal","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"Meals/day","value":"3 + 1-2 snacks","color":"bg-neutral-800 text-neutral-300 border-neutral-700"}],"tips":["tip1","tip2","tip3","tip4","tip5","tip6","tip7"]},
    {"id":"progress","tag":"Progress","tagColor":"bg-teal-500/20 text-teal-300 border-teal-500/30","title":"...","subtitle":"...","chips":[{"label":"Weekly balance","value":"... cal","color":"bg-rose-500/20 text-rose-300 border-rose-500/30"},{"label":"Expected/week","value":"... kg","color":"bg-neutral-800 text-neutral-300 border-neutral-700"},{"label":"Goal","value":"...","color":"bg-teal-500/20 text-teal-300 border-teal-500/30"}],"tips":["tip1","tip2","tip3","tip4","tip5","tip6","tip7","tip8"]}
  ]
}

recommendedGoal must be one of: cut, maintain, bulk, recomp. Replace all "..." with real personalized content.`;

    // ── 4. Call Gemini ────────────────────────────────────────────────────
    const result = await model.generateContent(prompt);
    const raw    = result.response.text();

    // ── 5. Strip any accidental markdown fences ───────────────────────────
    const clean  = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    // ── 6. Parse and return ───────────────────────────────────────────────
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[tdee-suggestions] error:", message);
    return NextResponse.json({ error: "Failed to generate suggestions", details: message }, { status: 500 });
  }
}