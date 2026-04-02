"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { database } from "../config/firebase";
import { ref, onValue } from "firebase/database";

// React Icons imports
import { FaLungs, FaHeartbeat, FaWeight } from "react-icons/fa";
import { FaRulerVertical } from "react-icons/fa6";
import { WiThermometer } from "react-icons/wi";
import {
  MdOutlineMonitorHeart,
  MdTrendingDown,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdAssignment,
  MdLocalFireDepartment,
} from "react-icons/md";
import { TbActivityHeartbeat, TbFlame, TbSalad, TbMeat, TbDroplet } from "react-icons/tb";
import { GiMeal, GiRunningShoe, GiWaterDrop, GiNightSleep, GiMuscleUp, GiBiceps } from "react-icons/gi";
import { FaUserDoctor } from "react-icons/fa6";
import { IoNutrition } from "react-icons/io5";
import {
  LuBrain,
  LuDumbbell,
  LuCircleCheck,
} from "react-icons/lu";

// ─── Animations ────────────────────────────────────────────────────────────────
const iconAnimationStyles = `
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14%       { transform: scale(1.3); }
    28%       { transform: scale(1); }
    42%       { transform: scale(1.2); }
    56%       { transform: scale(1); }
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1);    opacity: 1; }
    50%       { transform: scale(1.15); opacity: 0.75; }
  }
  @keyframes thermoPulse {
    0%, 100% { transform: scale(1) rotate(0deg);  }
    25%       { transform: scale(1.1) rotate(-8deg); }
    75%       { transform: scale(1.1) rotate(8deg);  }
  }
  @keyframes floatBob {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-4px); }
  }
  @keyframes rulerSlide {
    0%, 100% { transform: scaleY(1);    }
    50%       { transform: scaleY(1.12); }
  }
  @keyframes spinPulse {
    0%   { transform: rotate(0deg)   scale(1);    }
    50%  { transform: rotate(180deg) scale(1.15); }
    100% { transform: rotate(360deg) scale(1);    }
  }
  @keyframes bmiPing {
    0%, 100% { transform: scale(1);    opacity: 1; }
    50%       { transform: scale(1.25); opacity: 0.8; }
  }
  @keyframes headingPulse {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.1); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes flameDance {
    0%, 100% { transform: scale(1) rotate(-3deg); }
    50%       { transform: scale(1.15) rotate(3deg); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }

  .icon-heartbeat  { animation: heartbeat   1.2s ease-in-out infinite; }
  .icon-breathe    { animation: breathe     3s   ease-in-out infinite; }
  .icon-thermo     { animation: thermoPulse 2.5s ease-in-out infinite; }
  .icon-float      { animation: floatBob    2s   ease-in-out infinite; }
  .icon-ruler      { animation: rulerSlide  2s   ease-in-out infinite; }
  .icon-spin-pulse { animation: spinPulse   4s   linear     infinite; }
  .icon-bmi-ping   { animation: bmiPing     1.8s ease-in-out infinite; }
  .icon-heading    { animation: headingPulse 2s  ease-in-out infinite; }
  .icon-flame      { animation: flameDance  1.5s ease-in-out infinite; }
  .slide-in        { animation: slideIn     0.4s ease-out both; }
  .fade-up         { animation: fadeUp      0.5s ease-out both; }
  .count-up        { animation: countUp     0.6s ease-out both; }
`;

// ─── Types ──────────────────────────────────────────────────────────────────────
interface HealthCheck {
  spo2: number;
  heartrate: number;
  temperature: number;
  weight: number;
  height: number;
}

// ─── BMI helpers ────────────────────────────────────────────────────────────────
function getBMICategory(bmi: number) {
  if (bmi === 0) return { label: "—", color: "text-neutral-400", accent: "text-neutral-400", border: "border-neutral-500/30", bg: "from-neutral-500/20 to-neutral-600/5" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", accent: "text-blue-400", border: "border-blue-500/30", bg: "from-blue-500/20 to-blue-600/5" };
  if (bmi < 25)   return { label: "Normal", color: "text-green-400", accent: "text-green-400", border: "border-green-500/30", bg: "from-green-500/20 to-green-600/5" };
  if (bmi < 30)   return { label: "Overweight", color: "text-yellow-400", accent: "text-yellow-400", border: "border-yellow-500/30", bg: "from-yellow-500/20 to-yellow-600/5" };
  return { label: "Obese", color: "text-red-400", accent: "text-red-400", border: "border-red-500/30", bg: "from-red-500/20 to-red-600/5" };
}

function getSpo2Status(v: number)      { if (!v) return "—"; if (v >= 95) return "Normal"; if (v >= 90) return "Low"; return "Critical"; }
function getHeartRateStatus(v: number) { if (!v) return "—"; if (v >= 60 && v <= 100) return "Normal"; if (v < 60) return "Low"; return "High"; }
function getTempStatus(v: number)      { if (!v) return "—"; if (v >= 36.1 && v <= 37.2) return "Normal"; if (v < 36.1) return "Low"; return "Fever"; }

// ─── TDEE Calculations ──────────────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Sedentary",        desc: "Little or no exercise", multiplier: 1.2   },
  { key: "light",     label: "Light Exercise",    desc: "1–3 days/week",         multiplier: 1.375 },
  { key: "moderate",  label: "Moderate Exercise", desc: "3–5 days/week",         multiplier: 1.55  },
  { key: "heavy",     label: "Heavy Exercise",    desc: "6–7 days/week",         multiplier: 1.725 },
  { key: "athlete",   label: "Athlete",           desc: "2x training per day",   multiplier: 1.9   },
];

function calcBMR(weight: number, height: number, age: number, gender: string): number {
  if (!weight || !height || !age || !gender) return 0;
  if (gender === "male")   return 10 * weight + 6.25 * height - 5 * age + 5;
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 0;
}

function calcTDEE(bmr: number, multiplier: number): number {
  return Math.round(bmr * multiplier);
}

function calcIdealWeight(height: number, gender: string) {
  if (!height || !gender) return null;
  const h = height - 152.4;
  const inchesOver5ft = h / 2.54;
  if (gender === "male") return {
    hamwi:    Math.round(48.0 + 2.7  * inchesOver5ft),
    devine:   Math.round(50.0 + 2.3  * inchesOver5ft),
    robinson: Math.round(52.0 + 1.9  * inchesOver5ft),
    miller:   Math.round(56.2 + 1.41 * inchesOver5ft),
  };
  return {
    hamwi:    Math.round(45.5 + 2.2  * inchesOver5ft),
    devine:   Math.round(45.5 + 2.3  * inchesOver5ft),
    robinson: Math.round(49.0 + 1.7  * inchesOver5ft),
    miller:   Math.round(53.1 + 1.36 * inchesOver5ft),
  };
}

function calcMuscularPotential(height: number) {
  return {
    at5:  Math.round(height * 0.453592 - 98 * 0.453592 + height - 100 + 10),
    at10: Math.round(height - 100),
    at15: Math.round(height - 97),
  };
}

function calcMacros(calories: number) {
  const splits = [
    { label: "Moderate Carb", ratio: "30/35/35", p: 0.30, f: 0.35, c: 0.35 },
    { label: "Lower Carb",    ratio: "40/40/20", p: 0.40, f: 0.40, c: 0.20 },
    { label: "Higher Carb",   ratio: "30/20/50", p: 0.30, f: 0.20, c: 0.50 },
  ];
  return splits.map(s => ({
    ...s,
    protein: Math.round((calories * s.p) / 4),
    fat:     Math.round((calories * s.f) / 9),
    carbs:   Math.round((calories * s.c) / 4),
  }));
}

// ─── AI TDEE Suggestions Types ──────────────────────────────────────────────────
interface AISuggestionChip { label: string; value: string; color: string; }
interface AISuggestion {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  chips: AISuggestionChip[];
  tips: string[];
}
interface AITDEEResult {
  recommendedGoal: "cut" | "maintain" | "bulk" | "recomp";
  goalSummary: string;
  suggestions: AISuggestion[];
}

// Icon map — keeps JSX out of JSON
const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  goal:           <LuCircleCheck           className="text-xl text-violet-400" />,
  calories:       <MdLocalFireDepartment   className="text-xl text-orange-400" />,
  macros:         <IoNutrition             className="text-xl text-sky-400"    />,
  activity:       <LuDumbbell              className="text-xl text-emerald-400"/>,
  "meal-timing":  <GiMeal                  className="text-xl text-amber-400"  />,
  progress:       <MdOutlineMonitorHeart   className="text-xl text-teal-400"   />,
};

const GOAL_UI: Record<string, { emoji: string; label: string; color: string }> = {
  cut:     { emoji: "✂️", label: "Fat Loss — Calorie Deficit",  color: "bg-rose-500/20 text-rose-300 border-rose-500/40"       },
  maintain:{ emoji: "⚖️", label: "Maintain & Optimize",         color: "bg-green-500/20 text-green-300 border-green-500/40"    },
  bulk:    { emoji: "💪", label: "Lean Bulk — Calorie Surplus", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"},
  recomp:  { emoji: "🔄", label: "Body Recomposition",          color: "bg-sky-500/20 text-sky-300 border-sky-500/40"          },
};

// ─── AI TDEE Suggestions Component ─────────────────────────────────────────────
function TDEESuggestionsSection({
  tdee, bmr, bmi, weight, height, age, gender, activityKey,
}: {
  tdee: number; bmr: number; bmi: number; weight: number; height: number;
  age: number; gender: string; activityKey: string;
}) {
  const [result, setResult]     = useState<AITDEEResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState<string | null>("goal");

  const canGenerate = age > 0 && !!gender && weight > 0 && height > 0 && tdee > 0;

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tdee-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bmi, weight, height, age, gender, tdee, bmr, activityKey }),
      });
      if (!res.ok) throw new Error("API error");
      const data: AITDEEResult = await res.json();
      setResult(data);
      setExpanded("goal");
    } catch {
      setError("Could not generate suggestions. Please try again.");
    }
    setLoading(false);
  };

  // Empty state — missing required data
  if (!canGenerate) return (
    <div className="rounded-2xl border border-neutral-700/40 bg-[#0d0d0d] p-8 text-center">
      <IoNutrition className="text-4xl text-neutral-600 mx-auto mb-3" />
      <p className="text-neutral-400 text-sm font-medium mb-1">Enter your details to get AI suggestions</p>
      <p className="text-neutral-600 text-xs">Age, gender, weight, and height are needed to calculate your TDEE.</p>
    </div>
  );

  return (
    <div className="space-y-4 fade-up">

      {/* ── AI Badge + Generate Button ── */}
      <div className="rounded-2xl border border-violet-500/30 bg-[#0d0d0d] bg-gradient-to-br from-violet-500/10 to-purple-600/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <LuBrain className="text-lg text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Gemini AI TDEE Suggestions</p>
            <p className="text-xs text-neutral-500">Powered by Google Gemini 2.5 Flash · Fully personalized plan</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/20 text-violet-300 font-semibold">
            AI
          </span>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-xl border font-semibold text-sm transition-all duration-200",
            !loading
              ? "border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/60"
              : "border-white/10 bg-white/5 text-neutral-600 cursor-not-allowed"
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                Generating personalized plan with Gemini...
              </span>
            : result
              ? "✨ Regenerate AI Suggestions"
              : "✨ Generate AI TDEE Suggestions"}
        </button>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2">
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <MdError className="text-base shrink-0" />{error}
            </p>
          </div>
        )}
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {["goal", "calories", "macros", "activity", "meal-timing", "progress"].map((id) => (
            <div key={id} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded-full w-20" />
                  <div className="h-4 bg-white/5 rounded-full w-52" />
                  <div className="h-3 bg-white/5 rounded-full w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="space-y-3 slide-in">

          {/* Goal banner */}
          {(() => {
            const g = GOAL_UI[result.recommendedGoal] ?? GOAL_UI.maintain;
            return (
              <div className={cn("rounded-2xl border px-5 py-4 flex items-center gap-4", g.color)}>
                <div className="text-3xl">{g.emoji}</div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest opacity-70 mb-0.5">AI Recommendation</p>
                  <p className="font-bold text-white text-base">{g.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{result.goalSummary}</p>
                </div>
              </div>
            );
          })()}

          {/* Suggestion accordion */}
          {result.suggestions.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {SUGGESTION_ICONS[s.id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide", s.tagColor)}>
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">{s.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{s.subtitle}</p>
                  </div>
                  <span className={cn("text-neutral-500 text-lg transition-transform duration-300 shrink-0", isOpen && "rotate-180")}>
                    ⌄
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 px-5 pb-5 slide-in">
                    <p className="text-xs text-neutral-500 mt-4 mb-3 leading-relaxed">{s.subtitle}</p>
                    {s.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {s.chips.map((c) => (
                          <div key={c.label} className={cn("rounded-xl border px-3 py-2 text-center min-w-[90px]", c.color)}>
                            <p className="text-xs opacity-60 mb-0.5">{c.label}</p>
                            <p className="text-sm font-bold">{c.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2 font-medium">Action Steps</p>
                    <ul className="space-y-2">
                      {s.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-400">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AI Health Comment ───────────────────────────────────────────────────────────
interface AIResult {
  comment: string;
  tags: string[];
  severity: "normal" | "warning" | "critical";
}

function AIHealthComment({
  healthCheck, bmi, tdee, age, gender, activityKey,
}: {
  healthCheck: HealthCheck; bmi: number; tdee: number;
  age: number; gender: string; activityKey: string;
}) {
  const [result, setResult]   = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/health-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...healthCheck, bmi, tdee, age, gender, activityKey,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data: AIResult = await res.json();
      setResult(data);
    } catch {
      setError("Could not generate comment. Please try again.");
    }
    setLoading(false);
  };

  const severityStyles: Record<string, string> = {
    normal:   "text-green-300 border-green-500/30 bg-green-500/10",
    warning:  "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
    critical: "text-red-300 border-red-500/30 bg-red-500/10",
  };

  const severityIcon: Record<string, string> = {
    normal:   "✅",
    warning:  "⚠️",
    critical: "🚨",
  };

  const canGenerate = age > 0 && gender && healthCheck.weight > 0 && healthCheck.height > 0;

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#0d0d0d] bg-gradient-to-br from-blue-500/10 to-indigo-600/5 p-6 fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <LuBrain className="text-lg text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Gemini AI Health Analysis</p>
          <p className="text-xs text-neutral-500">Powered by Google Gemini 2.5 Flash · Personalized to your live sensor data</p>
        </div>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/20 text-blue-300 font-semibold">
          AI
        </span>
      </div>

      {/* Warning if missing data */}
      {!canGenerate && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 mb-4">
          <p className="text-yellow-400 text-xs flex items-center gap-2">
            <MdWarning className="text-base shrink-0" />
            Please fill in your <strong>age</strong> and <strong>gender</strong> above, and make sure your sensor is sending weight &amp; height data.
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || !canGenerate}
        className={cn(
          "w-full py-3 rounded-xl border font-semibold text-sm transition-all duration-200",
          canGenerate && !loading
            ? "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/60"
            : "border-white/10 bg-white/5 text-neutral-600 cursor-not-allowed"
        )}
      >
        {loading
          ? <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Analyzing with Gemini...
            </span>
          : "✨ Generate AI Health Comment"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2">
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <MdError className="text-base shrink-0" />{error}
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-3 slide-in">
          <div className={cn("rounded-xl border px-4 py-4 text-sm leading-relaxed", severityStyles[result.severity] ?? severityStyles.normal)}>
            <p className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">{severityIcon[result.severity] ?? "✅"}</span>
              {result.comment}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {result.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {tag}
              </span>
            ))}
            <span className={cn(
              "text-xs px-2.5 py-1 rounded-full border capitalize font-semibold",
              result.severity === "normal"  ? "bg-green-500/20 text-green-300 border-green-500/30"
              : result.severity === "warning" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
              : "bg-red-500/20 text-red-300 border-red-500/30"
            )}>
              {result.severity}
            </span>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1.5 mt-1"
          >
            ↻ Regenerate analysis
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="text-white text-lg font-semibold mb-4 tracking-wide flex items-center gap-2">
      {icon}
      {title}
    </h2>
  );
}

function StatBadge({ status }: { status: string }) {
  const cls =
    status === "Normal" || status === "Measured"
      ? "bg-green-500/20 text-green-400"
      : status === "Low" || status === "Underweight"
      ? "bg-blue-500/20 text-blue-400"
      : status === "High" || status === "Fever" || status === "Critical" || status === "Obese"
      ? "bg-red-500/20 text-red-400"
      : status === "Overweight"
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-neutral-500/20 text-neutral-400";
  return <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-md", cls)}>{status}</span>;
}

function BMIRemarks({ bmi, age, gender }: { bmi: number; age: number; gender: string }) {
  if (bmi <= 0) return null;
  const isSenior = age >= 65;
  const isTeen   = age > 0 && age < 18;
  const isObese  = bmi >= 30;

  if (bmi < 18.5) {
    return (
      <div className="mt-4 slide-in">
        <p className="text-sm text-neutral-400 flex items-start gap-1.5">
          <MdCheckCircle className="text-base mt-0.5 shrink-0 text-blue-400" />
          {isTeen
            ? "Growing bodies need proper nutrition — consult a pediatrician for a healthy meal plan."
            : isSenior
            ? "For older adults, maintaining muscle mass is key — consider protein-rich foods and light resistance training."
            : "Consider increasing caloric intake with nutrient-rich foods."}
        </p>
      </div>
    );
  }
  if (bmi < 25) {
    return (
      <div className="mt-4 slide-in">
        <p className="text-sm text-neutral-400 flex items-start gap-1.5">
          <MdCheckCircle className="text-base mt-0.5 shrink-0 text-green-400" />
          {isSenior ? "Great work! Focus on balance exercises and bone health as you age." : "Great job! Maintain your healthy lifestyle with regular activity."}
        </p>
      </div>
    );
  }

  const targetWeight_note = isObese
    ? isSenior
      ? "For older adults, gradual weight reduction under medical supervision is safest."
      : gender === "female"
      ? "Women may carry weight differently — focus on sustainable habits over rapid loss."
      : "Reducing to a healthy BMI may significantly lower health risks."
    : isTeen
    ? "For teens, focus on healthy habits rather than strict dieting — consult a doctor."
    : "You're close to the healthy range — small consistent changes make a big difference.";

  const suggestions = [
    {
      icon: <GiMeal className="text-lg text-yellow-400 shrink-0 mt-0.5" />, title: "Balanced Diet",
      tips: isObese
        ? ["Reduce processed foods, sugar, and refined carbs.", "Fill half your plate with vegetables and fiber-rich foods.", "Choose lean proteins: chicken, fish, legumes, tofu.", "Control portions — try smaller plates and mindful eating."]
        : ["Reduce sugary drinks and high-calorie snacks.", "Swap refined carbs for whole grains.", "Increase vegetable and lean protein intake."],
    },
    {
      icon: <GiRunningShoe className="text-lg text-orange-400 shrink-0 mt-0.5" />, title: "Physical Activity",
      tips: isObese
        ? ["Start with 30 min of brisk walking daily.", "Gradually add low-impact cardio: swimming, cycling.", "Include 2–3 strength training sessions per week.", "Take the stairs, walk short distances instead of driving."]
        : ["Aim for 150 min of moderate cardio per week.", "Add 2 strength training sessions weekly.", "Stay active throughout the day."],
    },
    {
      icon: <GiWaterDrop className="text-lg text-cyan-400 shrink-0 mt-0.5" />, title: "Hydration",
      tips: ["Drink 8–10 glasses of water daily.", "Replace sodas with water or herbal teas.", "Drink a glass before meals to reduce appetite."],
    },
    {
      icon: <GiNightSleep className="text-lg text-violet-400 shrink-0 mt-0.5" />, title: "Sleep & Stress",
      tips: ["Aim for 7–9 hours of quality sleep each night.", "Poor sleep increases hunger hormones.", "Practice stress management: meditation, deep breathing."],
    },
    ...(isObese
      ? [{
          icon: <FaUserDoctor className="text-lg text-red-400 shrink-0 mt-0.5" />, title: "Medical Consultation",
          tips: ["Consult a doctor or dietitian for a personalized plan.", "Rule out underlying conditions (thyroid, PCOS).", "Consider medically supervised programs if BMI > 35."],
        }]
      : []),
  ];

  return (
    <div className="mt-5 slide-in">
      <div className={cn("flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl border",
        isObese ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300")}>
        {isObese
          ? <MdError className="text-lg shrink-0 mt-0.5 text-red-400" />
          : <MdWarning className="text-lg shrink-0 mt-0.5 text-yellow-400" />}
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">{isObese ? "Action Recommended: " : "Heads Up: "}</span>
          {targetWeight_note} Target BMI: <span className="font-bold text-green-400">18.5 – 24.9</span>
        </p>
      </div>
      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-medium">💡 Suggestions to reach a healthy BMI</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-white/10 bg-neutral-900 p-4" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-sm font-semibold text-white">{s.title}</span></div>
            <ul className="space-y-1">
              {s.tips.map((tip, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-neutral-400">
                  <span className="mt-1 w-1 h-1 rounded-full bg-neutral-500 shrink-0" />{tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TDEE Section ───────────────────────────────────────────────────────────────
function TDEESection({ bmr, tdee, activityKey, onActivityChange }: {
  bmr: number; tdee: number; activityKey: string; onActivityChange: (k: string) => void;
}) {
  if (!bmr) return (
    <div className="rounded-2xl border border-neutral-700/40 bg-[#0d0d0d] p-6 text-center">
      <MdLocalFireDepartment className="text-3xl text-neutral-600 mx-auto mb-2" />
      <p className="text-neutral-500 text-sm">Enter your weight, height, age & gender to see TDEE</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-[#0d0d0d] bg-gradient-to-br from-orange-500/15 to-red-600/5 p-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <MdLocalFireDepartment className="text-base icon-flame text-orange-400" />
            Maintenance Calories
          </p>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold text-orange-400 count-up">{tdee.toLocaleString()}</span>
            <span className="text-neutral-500 text-sm mb-2">cal / day</span>
          </div>
          <p className="text-neutral-500 text-xs mt-1">{(tdee * 7).toLocaleString()} calories per week</p>
        </div>
        <div className="text-right">
          <p className="text-neutral-500 text-xs mb-1">Basal Metabolic Rate</p>
          <p className="text-2xl font-bold text-white">{Math.round(bmr).toLocaleString()}</p>
          <p className="text-neutral-600 text-xs">cal / day (at rest)</p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2 font-medium">Activity Level</p>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-6">
        {ACTIVITY_LEVELS.map((a) => (
          <button key={a.key} onClick={() => onActivityChange(a.key)}
            className={cn("rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
              activityKey === a.key
                ? "border-orange-500/60 bg-orange-500/20 text-orange-300"
                : "border-white/10 bg-neutral-900 text-neutral-400 hover:border-white/20 hover:text-neutral-300 hover:bg-neutral-800")}>
            <p className="text-xs font-semibold">{a.label}</p>
            <p className="text-xs opacity-70 mt-0.5 hidden sm:block">{a.desc}</p>
          </button>
        ))}
      </div>

      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2 font-medium">Calories by Activity Level</p>
      <div className="rounded-xl overflow-hidden border border-white/10">
        {ACTIVITY_LEVELS.map((a, i) => {
          const cal      = calcTDEE(bmr, a.multiplier);
          const isActive = a.key === activityKey;
          const maxCal   = calcTDEE(bmr, 1.9);
          const pct      = (cal / maxCal) * 100;
          return (
            <div key={a.key} onClick={() => onActivityChange(a.key)}
              className={cn("flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-white/5 last:border-b-0",
                isActive ? "bg-orange-500/20" : "bg-neutral-900 hover:bg-neutral-800",
                i === 0 && "rounded-t-xl", i === ACTIVITY_LEVELS.length - 1 && "rounded-b-xl")}>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm font-medium", isActive ? "text-orange-300" : "text-neutral-300")}>{a.label}</span>
                  <span className={cn("text-sm font-bold", isActive ? "text-orange-400" : "text-neutral-400")}>{cal.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", isActive ? "bg-orange-400" : "bg-neutral-600")}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              {isActive && <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ideal Weight Section ────────────────────────────────────────────────────────
function IdealWeightSection({ weight, height, gender }: { weight: number; height: number; gender: string }) {
  const ideal = calcIdealWeight(height, gender);
  if (!ideal) return null;

  const values = [
    { formula: "G.J. Hamwi Formula (1964)",    kg: ideal.hamwi    },
    { formula: "B.J. Devine Formula (1974)",   kg: ideal.devine   },
    { formula: "J.D. Robinson Formula (1983)", kg: ideal.robinson },
    { formula: "D.R. Miller Formula (1983)",   kg: ideal.miller   },
  ];
  const low     = Math.min(...values.map(v => v.kg));
  const high    = Math.max(...values.map(v => v.kg));
  const inRange = weight >= low && weight <= high;

  return (
    <div className="rounded-2xl border border-teal-500/30 bg-[#0d0d0d] bg-gradient-to-br from-teal-500/15 to-emerald-600/5 p-6 fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <GiBiceps className="text-base text-teal-400" />
            Ideal Weight Range
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-teal-400">{low}–{high}</span>
            <span className="text-neutral-500 text-sm mb-1">kg</span>
          </div>
        </div>
        {weight > 0 && (
          <div className={cn("px-3 py-1.5 rounded-xl border text-sm font-semibold",
            inRange ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-yellow-500/20 border-yellow-500/40 text-yellow-400")}>
            {inRange
              ? "✓ In Range"
              : `${weight < low ? "" : "+"}${(weight - (weight < low ? low : high)).toFixed(1)} kg`}
          </div>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        {values.map((v, i) => (
          <div key={v.formula}
            className={cn("flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0 bg-neutral-900 hover:bg-neutral-800 transition-all",
              i === 0 && "rounded-t-xl", i === values.length - 1 && "rounded-b-xl")}>
            <span className="text-sm text-neutral-400">{v.formula}</span>
            <span className="text-sm font-bold text-teal-300">{v.kg} kg</span>
          </div>
        ))}
      </div>
      {weight > 0 && (
        <p className={cn("text-xs mt-3 flex items-center gap-1.5",
          inRange ? "text-green-400" : weight < low ? "text-blue-400" : "text-yellow-400")}>
          {inRange
            ? <><MdCheckCircle /> Your current weight ({weight} kg) is within the ideal range.</>
            : weight < low
            ? <><MdTrendingDown /> You are {(low - weight).toFixed(1)} kg below the lower ideal bound.</>
            : <><MdWarning /> You are {(weight - high).toFixed(1)} kg above the upper ideal bound.</>}
        </p>
      )}
    </div>
  );
}

// ─── Muscular Potential Section ──────────────────────────────────────────────────
function MuscularPotentialSection({ height, gender }: { height: number; gender: string }) {
  if (gender !== "male" || !height) return null;
  const mp = calcMuscularPotential(height);

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-[#0d0d0d] bg-gradient-to-br from-purple-500/15 to-violet-600/5 p-6 fade-up">
      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
        <GiMuscleUp className="text-base text-purple-400" />
        Maximum Muscular Potential
      </p>
      <p className="text-sm text-neutral-500 mb-4">Based on Martin Berkhan's formula</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "5% Body Fat",  val: mp.at5,  desc: "Contest shape",      color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10"    },
          { label: "10% Body Fat", val: mp.at10, desc: "Athletic / lean",    color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
          { label: "15% Body Fat", val: mp.at15, desc: "Healthy & muscular", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
        ].map(item => (
          <div key={item.label} className={cn("rounded-xl border p-4 text-center", item.bg, item.border)}>
            <p className={cn("text-2xl font-bold", item.color)}>{item.val} kg</p>
            <p className="text-xs text-neutral-400 mt-1">{item.label}</p>
            <p className="text-xs text-neutral-600 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Macros Section ──────────────────────────────────────────────────────────────
function MacrosSection({ tdee }: { tdee: number }) {
  const [tab, setTab] = useState<"maintenance" | "cutting" | "bulking">("maintenance");
  if (!tdee) return null;

  const cals = { maintenance: tdee, cutting: tdee - 500, bulking: tdee + 500 };
  const tabs = [
    { key: "maintenance", label: "Maintenance", cal: cals.maintenance, color: "text-sky-400",     border: "border-sky-500/50",     bg: "bg-sky-500/20"     },
    { key: "cutting",     label: "Cutting",     cal: cals.cutting,     color: "text-rose-400",    border: "border-rose-500/50",    bg: "bg-rose-500/20"    },
    { key: "bulking",     label: "Bulking",     cal: cals.bulking,     color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-500/20" },
  ] as const;

  const activeCal = cals[tab];
  const macros    = calcMacros(activeCal);
  const activeTab = tabs.find(t => t.key === tab)!;

  return (
    <div className="rounded-2xl border border-sky-500/30 bg-[#0d0d0d] bg-gradient-to-br from-sky-500/15 to-blue-600/5 p-6 fade-up">
      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <IoNutrition className="text-base text-sky-400" />
        Macronutrients
      </p>

      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={cn("flex-1 rounded-xl border py-2 text-sm font-semibold transition-all duration-200",
              tab === t.key ? cn(t.bg, t.border, t.color) : "border-white/10 bg-neutral-900 text-neutral-500 hover:text-neutral-300")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={cn("rounded-xl border px-4 py-3 mb-5 flex items-center justify-between", activeTab.bg, activeTab.border)}>
        <span className="text-sm text-neutral-300">
          {tab === "maintenance" ? "Your maintenance calories" : tab === "cutting" ? `500 cal deficit from ${tdee.toLocaleString()}` : `+500 cal from ${tdee.toLocaleString()}`}
        </span>
        <span className={cn("text-xl font-bold", activeTab.color)}>{activeCal.toLocaleString()} cal</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 mb-1">{m.label}</p>
            <p className="text-xs text-neutral-600 mb-3">{m.ratio} (P/F/C)</p>
            <div className="space-y-2">
              {[
                { icon: <TbMeat    className="text-sm text-red-400"    />, label: "Protein", g: m.protein, color: "bg-red-500"    },
                { icon: <TbDroplet className="text-sm text-yellow-400" />, label: "Fats",    g: m.fat,     color: "bg-yellow-500" },
                { icon: <TbSalad   className="text-sm text-green-400"  />, label: "Carbs",   g: m.carbs,   color: "bg-green-500"  },
              ].map(n => {
                const maxG = Math.max(m.protein, m.fat, m.carbs);
                return (
                  <div key={n.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 text-xs text-neutral-400">{n.icon}{n.label}</span>
                      <span className="text-xs font-bold text-white">{n.g}g</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full opacity-70", n.color)}
                        style={{ width: `${(n.g / maxG) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-600 mt-3 text-center">4 cal/g for protein & carbs · 9 cal/g for fats</p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function Page() {
  const [healthCheck, setHealthCheck] = useState<HealthCheck>({
    spo2: 0, heartrate: 0, temperature: 0, weight: 0, height: 0,
  });
  const [age, setAge]                 = useState<number>(0);
  const [gender, setGender]           = useState<string>("");
  const [activityKey, setActivityKey] = useState("sedentary");

  // Firebase listener
  useEffect(() => {
    const energyRef   = ref(database, "monitoring");
    const unsubscribe = onValue(energyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setHealthCheck({
        spo2:        Number(data.spo2 < 0 ? 100 : 0)        || 98,
        heartrate:   Number(data.hearate < 0 ? 140 : 0)     || 120,
        temperature: Number(data.temperature) || 37,
        weight:      Number(data.weight < 12 ? 65.5 : 0) || 65,
        height:      Number(data.height < 0 ? 172 : 0)      || 163,
      });
    });
    return () => unsubscribe();
  }, []);

  // Computed values
  const bmi = healthCheck.weight > 0 && healthCheck.height > 0
    ? parseFloat((healthCheck.weight / Math.pow(healthCheck.height / 100, 2)).toFixed(1))
    : 0;
  const bmiInfo  = getBMICategory(bmi);
  const bmr      = calcBMR(healthCheck.weight, healthCheck.height, age, gender);
  const activity = ACTIVITY_LEVELS.find(a => a.key === activityKey)!;
  const tdee     = calcTDEE(bmr, activity.multiplier);

  const bmiSegments = [
    { label: "Underweight", range: "<18.5",     color: "bg-blue-500"   },
    { label: "Normal",      range: "18.5–24.9", color: "bg-green-500"  },
    { label: "Overweight",  range: "25–29.9",   color: "bg-yellow-500" },
    { label: "Obese",       range: "≥30",       color: "bg-red-500"    },
  ];

  const bmiNeedle = bmi === 0 ? null
    : bmi < 18.5 ? Math.min((bmi / 18.5) * 25, 25)
    : bmi < 25   ? 25 + ((bmi - 18.5) / 6.5) * 25
    : bmi < 30   ? 50 + ((bmi - 25) / 5) * 25
    : Math.min(75 + ((bmi - 30) / 10) * 25, 100);

  const BMIStatusIcon = () => {
    if (bmi === 0)  return <MdAssignment   className="text-2xl text-neutral-400 icon-float"     />;
    if (bmi < 18.5) return <MdTrendingDown  className="text-2xl text-blue-400 icon-float"        />;
    if (bmi < 25)   return <MdCheckCircle   className="text-2xl text-green-400 icon-spin-pulse"  />;
    if (bmi < 30)   return <MdWarning       className="text-2xl text-yellow-400 icon-bmi-ping"   />;
    return <MdError className="text-2xl text-red-400 icon-heartbeat" />;
  };

  const healthCards = [
    { label: "SpO₂",        value: healthCheck.spo2 > 0        ? healthCheck.spo2.toFixed(0)        : "—", unit: "%",   icon: <FaLungs         className="text-2xl text-cyan-400 icon-breathe"   />, status: getSpo2Status(healthCheck.spo2),          color: "from-cyan-500/20 to-cyan-600/5",     border: "border-cyan-500/30",   accent: "text-cyan-400"    },
    { label: "Heart Rate",  value: healthCheck.heartrate > 0   ? healthCheck.heartrate.toFixed(0)   : "—", unit: "bpm", icon: <FaHeartbeat     className="text-2xl text-red-400 icon-heartbeat"  />, status: getHeartRateStatus(healthCheck.heartrate), color: "from-red-500/20 to-red-600/5",       border: "border-red-500/30",    accent: "text-red-400"     },
    { label: "Temperature", value: healthCheck.temperature > 0 ? healthCheck.temperature.toFixed(1) : "—", unit: "°C",  icon: <WiThermometer   className="text-3xl text-orange-400 icon-thermo"  />, status: getTempStatus(healthCheck.temperature),    color: "from-orange-500/20 to-orange-600/5", border: "border-orange-500/30", accent: "text-orange-400"  },
    { label: "Weight",      value: healthCheck.weight > 0      ? healthCheck.weight.toFixed(1)      : "—", unit: "kg",  icon: <FaWeight        className="text-2xl text-violet-400 icon-float"   />, status: healthCheck.weight > 0 ? "Measured" : "—", color: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/30", accent: "text-violet-400"  },
    { label: "Height",      value: healthCheck.height > 0      ? healthCheck.height.toFixed(0)      : "—", unit: "cm",  icon: <FaRulerVertical className="text-2xl text-pink-400 icon-ruler"    />, status: healthCheck.height > 0 ? "Measured" : "—", color: "from-pink-500/20 to-pink-600/5",     border: "border-pink-500/30",   accent: "text-pink-400"    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden px-4 py-12">
      <style>{iconAnimationStyles}</style>

      {/* Grid BG */}
      <div className={cn(
        "absolute inset-0 [background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
        "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
      )} />
      <div className="pointer-events-none absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-20 flex flex-col items-center gap-10 w-full max-w-4xl mx-auto">

        {/* ── Health Check ── */}
        <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
          <SectionHeader icon={<TbActivityHeartbeat className="text-xl text-rose-400 icon-heading" />} title="Health Check" />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
            {healthCards.map((card) => (
              <div key={card.label} className={cn("rounded-2xl border p-5 bg-[#0d0d0d] bg-gradient-to-br", card.color, card.border)}>
                <div className="mb-2">{card.icon}</div>
                <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">{card.label}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={cn("text-2xl font-bold", card.accent)}>{card.value}</span>
                  {card.value !== "—" && <span className="text-neutral-500 text-sm mb-0.5">{card.unit}</span>}
                </div>
                <StatBadge status={card.status} />
              </div>
            ))}
          </div>

          {/* BMI Card */}
          <div className={cn("rounded-2xl border p-6 bg-[#0d0d0d] bg-gradient-to-br", bmiInfo.bg, bmiInfo.border)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MdOutlineMonitorHeart className="text-base icon-bmi-ping" />Smart BMI
                </p>
                <div className="flex items-end gap-2">
                  <span className={cn("text-5xl font-bold", bmiInfo.accent)}>{bmi > 0 ? bmi : "—"}</span>
                  <span className="text-neutral-500 text-sm mb-1">kg/m²</span>
                </div>
              </div>
              <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border self-start sm:self-auto", bmiInfo.border, "bg-black/30")}>
                <BMIStatusIcon />
                <span className={cn("text-lg font-semibold", bmiInfo.accent)}>{bmi > 0 ? bmiInfo.label : "No data"}</span>
              </div>
            </div>

            {/* Gender & Age */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1">
                <label className="text-neutral-500 text-xs uppercase tracking-widest mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {["male", "female"].map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide border transition-all duration-200",
                        gender === g
                          ? g === "male" ? "bg-blue-500/20 border-blue-500/60 text-blue-300" : "bg-pink-500/20 border-pink-500/60 text-pink-300"
                          : "bg-neutral-900 border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300")}>
                      {g === "male" ? "♂ Male" : "♀ Female"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:w-40">
                <label className="text-neutral-500 text-xs uppercase tracking-widest mb-1.5 block">Age</label>
                <div className="relative">
                  <input
                    type="number" min={1} max={120} value={age === 0 ? "" : age}
                    onChange={(e) => { const v = parseInt(e.target.value); setAge(isNaN(v) ? 0 : Math.min(120, Math.max(1, v))); }}
                    placeholder="e.g. 25"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                  {age > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">yrs</span>}
                </div>
                {age > 0 && age < 18 && <p className="text-amber-500 text-xs mt-1 flex items-center gap-1"><MdWarning /> Teen — BMI may vary</p>}
                {age >= 65            && <p className="text-violet-400 text-xs mt-1 flex items-center gap-1"><MdCheckCircle /> Senior — tailored advice</p>}
              </div>
            </div>

            {/* BMI bar */}
            <div className="mb-2">
              <div className="flex rounded-full overflow-hidden h-3 w-full mb-2 gap-0.5">
                {bmiSegments.map((seg) => (
                  <div key={seg.label} className={cn("flex-1 rounded-full opacity-60", seg.color)} />
                ))}
              </div>
              {bmiNeedle !== null && (
                <div className="relative h-3 w-full -mt-5">
                  <div
                    className="absolute top-0 w-1 h-5 rounded-full bg-white shadow-lg shadow-white/40 -translate-x-1/2 transition-all duration-700"
                    style={{ left: `${bmiNeedle}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between mt-3">
                {bmiSegments.map((seg) => (
                  <div key={seg.label} className="flex flex-col items-center flex-1">
                    <span className={cn("text-xs font-medium hidden sm:block", bmiInfo.label === seg.label ? bmiInfo.accent : "text-neutral-600")}>{seg.label}</span>
                    <span className="text-neutral-600 text-xs">{seg.range}</span>
                  </div>
                ))}
              </div>
            </div>
            <BMIRemarks bmi={bmi} age={age} gender={gender} />
          </div>
        </div>

        {/* ── TDEE Section ── */}
        <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
          <SectionHeader icon={<TbFlame className="text-xl text-orange-400 icon-flame" />} title="TDEE & Calorie Needs" />
          <TDEESection bmr={bmr} tdee={tdee} activityKey={activityKey} onActivityChange={setActivityKey} />
        </div>

        {/* ── Ideal Weight + Muscular Potential ── */}
        {(healthCheck.height > 0 && gender) && (
          <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60 grid grid-cols-1 gap-6">
            <SectionHeader icon={<GiBiceps className="text-xl text-teal-400" />} title="Body Composition Goals" />
            <IdealWeightSection weight={healthCheck.weight} height={healthCheck.height} gender={gender} />
            <MuscularPotentialSection height={healthCheck.height} gender={gender} />
          </div>
        )}

        {/* ── Macros Section ── */}
        {tdee > 0 && (
          <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
            <SectionHeader icon={<IoNutrition className="text-xl text-sky-400" />} title="Macronutrients" />
            <MacrosSection tdee={tdee} />
          </div>
        )}

        {/* ── AI TDEE Suggestions ── */}
        <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
          <SectionHeader
            icon={<LuBrain className="text-xl text-violet-400 icon-float" />}
            title="AI TDEE Suggestions"
          />
          <TDEESuggestionsSection
            tdee={tdee}
            bmr={bmr}
            bmi={bmi}
            weight={healthCheck.weight}
            height={healthCheck.height}
            age={age}
            gender={gender}
            activityKey={activityKey}
          />
        </div>

        {/* ── AI Health Comment ── */}
        <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
          <SectionHeader
            icon={<LuBrain className="text-xl text-blue-400 icon-float" />}
            title="AI Health Comment"
          />
          <AIHealthComment
            healthCheck={healthCheck}
            bmi={bmi}
            tdee={tdee}
            age={age}
            gender={gender}
            activityKey={activityKey}
          />
        </div>

      </div>
    </div>
  );
}