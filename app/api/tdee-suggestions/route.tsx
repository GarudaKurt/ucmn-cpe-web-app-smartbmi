import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { bmi, weight, height, age, gender, tdee, bmr, activityKey } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert fitness and nutrition AI.
Analyze the user's health data and return a personalized TDEE-based plan.
Respond ONLY in valid JSON — no markdown, no explanation, no backticks.

User data:
- BMI: ${bmi}, Weight: ${weight}kg, Height: ${height}cm
- Age: ${age}, Gender: ${gender}
- BMR: ${bmr} cal/day, TDEE: ${tdee} cal/day, Activity: ${activityKey}

Return exactly this JSON shape — all 6 suggestion objects are required:
{
  "recommendedGoal": "cut" | "maintain" | "bulk" | "recomp",
  "goalSummary": "one sentence why this goal fits the user",
  "suggestions": [
    {
      "id": "goal",
      "tag": "Goal",
      "tagColor": "bg-violet-500/20 text-violet-300 border-violet-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "string", "value": "string", "color": "bg-neutral-800 text-neutral-300 border-neutral-700" }
      ],
      "tips": ["string", "string", "string", "string", "string"]
    },
    {
      "id": "calories",
      "tag": "Calories",
      "tagColor": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "string", "value": "string", "color": "bg-neutral-800 text-neutral-300 border-neutral-700" }
      ],
      "tips": ["string", "string", "string", "string", "string", "string", "string"]
    },
    {
      "id": "macros",
      "tag": "Macros",
      "tagColor": "bg-sky-500/20 text-sky-300 border-sky-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "Protein", "value": "string", "color": "bg-red-500/20 text-red-300 border-red-500/30" },
        { "label": "Fat", "value": "string", "color": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
        { "label": "Carbs", "value": "string", "color": "bg-green-500/20 text-green-300 border-green-500/30" }
      ],
      "tips": ["string", "string", "string", "string", "string", "string", "string"]
    },
    {
      "id": "activity",
      "tag": "Activity",
      "tagColor": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "string", "value": "string", "color": "bg-neutral-800 text-neutral-300 border-neutral-700" }
      ],
      "tips": ["string", "string", "string", "string", "string"]
    },
    {
      "id": "meal-timing",
      "tag": "Meal Timing",
      "tagColor": "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "string", "value": "string", "color": "bg-amber-500/20 text-amber-300 border-amber-500/30" }
      ],
      "tips": ["string", "string", "string", "string", "string", "string", "string"]
    },
    {
      "id": "progress",
      "tag": "Progress",
      "tagColor": "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "title": "string",
      "subtitle": "string",
      "chips": [
        { "label": "string", "value": "string", "color": "bg-neutral-800 text-neutral-300 border-neutral-700" }
      ],
      "tips": ["string", "string", "string", "string", "string", "string", "string", "string"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text();
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[tdee-suggestions] error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: String(err) },
      { status: 500 }
    );
  }
}