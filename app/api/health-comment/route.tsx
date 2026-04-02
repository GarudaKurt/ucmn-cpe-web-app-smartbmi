import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Guard: API key must exist ──────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      console.error("[health-comment] GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
    const body = await req.json();
    const { spo2, heartrate, temperature, bmi, weight, height, age, gender, tdee, activityKey } = body;

    // ── 3. Use gemini-2.5-flash with thinking disabled for speed ──────────
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        // @ts-ignore — thinkingConfig is supported but not yet typed in older SDK versions
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const prompt = `You are a friendly health AI assistant.
Analyze this patient data and respond ONLY in valid JSON — no markdown fences, no explanation, no extra text.

Patient:
- SpO2: ${spo2}%, Heart rate: ${heartrate} bpm, Temp: ${temperature}°C
- BMI: ${bmi}, Weight: ${weight}kg, Height: ${height}cm
- Age: ${age}, Gender: ${gender}
- TDEE: ${tdee} cal/day, Activity: ${activityKey}

Respond with EXACTLY this JSON shape and nothing else:
{"comment":"3-4 sentence personalized health analysis","tags":["tag1","tag2","tag3"],"severity":"normal"}

severity must be one of: normal, warning, critical`;

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
    console.error("[health-comment] error:", message);
    return NextResponse.json({ error: "Failed to generate health comment", details: message }, { status: 500 });
  }
}