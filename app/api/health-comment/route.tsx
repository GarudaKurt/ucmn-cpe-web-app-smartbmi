import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { spo2, heartrate, temperature, bmi,
            weight, height, age, gender, tdee, activityKey } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a friendly health AI assistant.
Analyze this patient data and respond ONLY in valid JSON — no markdown, no explanation.

Patient:
- SpO2: ${spo2}%, Heart rate: ${heartrate} bpm, Temp: ${temperature}°C
- BMI: ${bmi}, Weight: ${weight}kg, Height: ${height}cm
- Age: ${age}, Gender: ${gender}
- TDEE: ${tdee} cal/day, Activity: ${activityKey}

Respond with exactly this JSON shape:
{
  "comment": "3-4 sentence personalized health analysis",
  "tags": ["short tag 1", "short tag 2", "short tag 3"],
  "severity": "normal" or "warning" or "critical"
}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text();
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[health-comment] error:", err);
    return NextResponse.json(
      { error: "Failed to generate health comment", details: String(err) },
      { status: 500 }
    );
  }
}