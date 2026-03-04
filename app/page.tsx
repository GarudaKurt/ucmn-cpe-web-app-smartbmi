"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { database } from "../config/firebase";
import { ref, onValue, update } from "firebase/database";

// React Icons imports
import { FaLungs, FaHeartbeat, FaWeight } from "react-icons/fa";
import { FaRulerVertical, FaVenusMars, FaCakeCandles } from "react-icons/fa6";
import { WiThermometer } from "react-icons/wi";
import {
  MdOutlineMonitorHeart,
  MdTrendingDown,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdAssignment,
} from "react-icons/md";
import { TbActivityHeartbeat } from "react-icons/tb";
import { GiMeal, GiRunningShoe, GiWaterDrop, GiNightSleep } from "react-icons/gi";
import { FaUserDoctor } from "react-icons/fa6";

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

  .icon-heartbeat  { animation: heartbeat   1.2s ease-in-out infinite; }
  .icon-breathe    { animation: breathe     3s   ease-in-out infinite; }
  .icon-thermo     { animation: thermoPulse 2.5s ease-in-out infinite; }
  .icon-float      { animation: floatBob    2s   ease-in-out infinite; }
  .icon-ruler      { animation: rulerSlide  2s   ease-in-out infinite; }
  .icon-spin-pulse { animation: spinPulse   4s   linear     infinite; }
  .icon-bmi-ping   { animation: bmiPing     1.8s ease-in-out infinite; }
  .icon-heading    { animation: headingPulse 2s  ease-in-out infinite; }
  .slide-in        { animation: slideIn     0.4s ease-out both; }
`;

interface HealthCheck {
  spo2: number;
  heartrate: number;
  temperature: number;
  weight: number;
  height: number;
}

interface TargetData {
  value: number;
  startDate: string;
  endDate: string;
}

function getBMICategory(bmi: number): {
  label: string;
  color: string;
  accent: string;
  border: string;
  bg: string;
} {
  if (bmi === 0) return { label: "—", color: "text-neutral-400", accent: "text-neutral-400", border: "border-neutral-500/30", bg: "from-neutral-500/20 to-neutral-600/5" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", accent: "text-blue-400", border: "border-blue-500/30", bg: "from-blue-500/20 to-blue-600/5" };
  if (bmi < 25) return { label: "Normal", color: "text-green-400", accent: "text-green-400", border: "border-green-500/30", bg: "from-green-500/20 to-green-600/5" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400", accent: "text-yellow-400", border: "border-yellow-500/30", bg: "from-yellow-500/20 to-yellow-600/5" };
  return { label: "Obese", color: "text-red-400", accent: "text-red-400", border: "border-red-500/30", bg: "from-red-500/20 to-red-600/5" };
}

function getSpo2Status(spo2: number): string {
  if (spo2 === 0) return "—";
  if (spo2 >= 95) return "Normal";
  if (spo2 >= 90) return "Low";
  return "Critical";
}

function getHeartRateStatus(hr: number): string {
  if (hr === 0) return "—";
  if (hr >= 60 && hr <= 100) return "Normal";
  if (hr < 60) return "Low";
  return "High";
}

function getTempStatus(temp: number): string {
  if (temp === 0) return "—";
  if (temp >= 36.1 && temp <= 37.2) return "Normal";
  if (temp < 36.1) return "Low";
  return "Fever";
}

function BMIRemarks({ bmi, age, gender }: { bmi: number; age: number; gender: string }) {
  if (bmi <= 0) return null;

  const isSenior = age >= 65;
  const isTeen = age > 0 && age < 18;

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
          {isSenior
            ? "Great work! Focus on balance exercises and bone health as you age."
            : "Great job! Maintain your healthy lifestyle with regular activity."}
        </p>
      </div>
    );
  }

  const isObese = bmi >= 30;
  const targetBMI = isObese ? "24.9" : "24.9";
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
      icon: <GiMeal className="text-lg text-yellow-400 shrink-0 mt-0.5" />,
      title: "Balanced Diet",
      tips: isObese
        ? [
            "Reduce processed foods, sugar, and refined carbs.",
            "Fill half your plate with vegetables and fiber-rich foods.",
            "Choose lean proteins: chicken, fish, legumes, tofu.",
            "Control portions — try smaller plates and mindful eating.",
          ]
        : [
            "Reduce sugary drinks and high-calorie snacks.",
            "Swap refined carbs (white rice, bread) for whole grains.",
            "Increase vegetable and lean protein intake.",
          ],
    },
    {
      icon: <GiRunningShoe className="text-lg text-orange-400 shrink-0 mt-0.5" />,
      title: "Physical Activity",
      tips: isObese
        ? [
            "Start with 30 min of brisk walking daily.",
            "Gradually add low-impact cardio: swimming, cycling, or dancing.",
            "Include 2–3 strength training sessions per week to boost metabolism.",
            "Take the stairs, walk short distances instead of driving.",
          ]
        : [
            "Aim for 150 min of moderate cardio per week (e.g., jogging, cycling).",
            "Add 2 strength training sessions weekly.",
            "Stay active throughout the day — avoid long sedentary stretches.",
          ],
    },
    {
      icon: <GiWaterDrop className="text-lg text-cyan-400 shrink-0 mt-0.5" />,
      title: "Hydration",
      tips: [
        "Drink 8–10 glasses of water daily.",
        "Replace sodas and juices with water or herbal teas.",
        "Drink a glass of water before meals to reduce appetite.",
      ],
    },
    {
      icon: <GiNightSleep className="text-lg text-violet-400 shrink-0 mt-0.5" />,
      title: "Sleep & Stress",
      tips: [
        "Aim for 7–9 hours of quality sleep each night.",
        "Poor sleep increases hunger hormones (ghrelin) and cravings.",
        "Practice stress management: meditation, deep breathing, or yoga.",
      ],
    },
    ...(isObese
      ? [
          {
            icon: <FaUserDoctor className="text-lg text-red-400 shrink-0 mt-0.5" />,
            title: "Medical Consultation",
            tips: [
              "Consult a doctor or dietitian for a personalized weight-loss plan.",
              "Rule out underlying conditions (thyroid, PCOS, etc.) that affect weight.",
              "Consider medically supervised programs if BMI is above 35.",
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="mt-5 slide-in">
      <div
        className={cn(
          "flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl border",
          isObese
            ? "bg-red-500/10 border-red-500/30 text-red-300"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
        )}
      >
        {isObese ? (
          <MdError className="text-lg shrink-0 mt-0.5 text-red-400" />
        ) : (
          <MdWarning className="text-lg shrink-0 mt-0.5 text-yellow-400" />
        )}
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">
            {isObese ? "Action Recommended: " : "Heads Up: "}
          </span>
          {targetWeight_note} Target BMI:{" "}
          <span className="font-bold text-green-400">18.5 – {targetBMI}</span>
        </p>
      </div>

      {/* Suggestion cards */}
      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-medium">
        💡 Suggestions to reach a healthy BMI
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <div
            key={s.title}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="flex items-center gap-2 mb-2">
              {s.icon}
              <span className="text-sm font-semibold text-white">{s.title}</span>
            </div>
            <ul className="space-y-1">
              {s.tips.map((tip, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-neutral-400">
                  <span className="mt-1 w-1 h-1 rounded-full bg-neutral-500 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [supply, setSupply] = useState(false);

  const [healthCheck, setHealthCheck] = useState<HealthCheck>({
    spo2: 0,
    heartrate: 0,
    temperature: 0,
    weight: 0,
    height: 0,
  });

  const [energyData, setEnergyData] = useState({
    kWh: 0,
    voltage: 0,
    power: 0,
    ampere: 0,
    totalkWh: 0,
  });

  const [targetKWh, setTargetKWh] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savedTarget, setSavedTarget] = useState<{
    kWh: string;
    start: string;
    end: string;
  } | null>(null);
  const [targetError, setTargetError] = useState("");
  const [liveTarget, setLiveTarget] = useState<TargetData | null>(null);

  const [pesoRate, setPesoRate] = useState("");
  const [savedPesoRate, setSavedPesoRate] = useState<number | null>(null);
  const [pesoRateError, setPesoRateError] = useState("");

  // Age & Gender for BMI context
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState<string>("");

  const estimatedCost =
    savedPesoRate !== null
      ? parseFloat((energyData.totalkWh * savedPesoRate).toFixed(2))
      : null;

  const prevKWhRef = useRef<number | null>(null);
  const isUpdatingRef = useRef(false);
  const displayTotalRef = useRef<number>(0);

  // Compute BMI
  const bmi =
    healthCheck.weight > 0 && healthCheck.height > 0
      ? parseFloat(
          (
            healthCheck.weight /
            Math.pow(healthCheck.height / 100, 2)
          ).toFixed(1)
        )
      : 0;

  const bmiInfo = getBMICategory(bmi);

  useEffect(() => {
    const energyRef = ref(database, "monitoring");
    const unsubscribe = onValue(energyRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase data:", data);
      if (!data) return;

      setHealthCheck({
        spo2: Number(data.spo2) || 99,
        heartrate: Number(data.heartrate) || 120,
        temperature: Number(data.temperature) || 33.3,
        weight: Number(data.weight) || 83,
        height: Number(data.height) || 152,
      });

    });
    return () => unsubscribe();
  }, []);


  const bmiSegments = [
    { label: "Underweight", range: "<18.5", color: "bg-blue-500" },
    { label: "Normal", range: "18.5–24.9", color: "bg-green-500" },
    { label: "Overweight", range: "25–29.9", color: "bg-yellow-500" },
    { label: "Obese", range: "≥30", color: "bg-red-500" },
  ];

  const bmiNeedle =
    bmi === 0
      ? null
      : bmi < 18.5
      ? Math.min((bmi / 18.5) * 25, 25)
      : bmi < 25
      ? 25 + ((bmi - 18.5) / 6.5) * 25
      : bmi < 30
      ? 50 + ((bmi - 25) / 5) * 25
      : Math.min(75 + ((bmi - 30) / 10) * 25, 100);

  const BMIStatusIcon = () => {
    if (bmi === 0) return <MdAssignment className="text-2xl text-neutral-400 icon-float" />;
    if (bmi < 18.5) return <MdTrendingDown className="text-2xl text-blue-400 icon-float" />;
    if (bmi < 25) return <MdCheckCircle className="text-2xl text-green-400 icon-spin-pulse" />;
    if (bmi < 30) return <MdWarning className="text-2xl text-yellow-400 icon-bmi-ping" />;
    return <MdError className="text-2xl text-red-400 icon-heartbeat" />;
  };

  const healthCards = [
    {
      label: "SpO₂",
      value: healthCheck.spo2 > 0 ? healthCheck.spo2.toFixed(0) : "—",
      unit: "%",
      icon: <FaLungs className="text-2xl text-cyan-400 icon-breathe" />,
      status: getSpo2Status(healthCheck.spo2),
      color: "from-cyan-500/20 to-cyan-600/5",
      border: "border-cyan-500/30",
      accent: "text-cyan-400",
    },
    {
      label: "Heart Rate",
      value: healthCheck.heartrate > 0 ? healthCheck.heartrate.toFixed(0) : "—",
      unit: "bpm",
      icon: <FaHeartbeat className="text-2xl text-red-400 icon-heartbeat" />,
      status: getHeartRateStatus(healthCheck.heartrate),
      color: "from-red-500/20 to-red-600/5",
      border: "border-red-500/30",
      accent: "text-red-400",
    },
    {
      label: "Temperature",
      value:
        healthCheck.temperature > 0
          ? healthCheck.temperature.toFixed(1)
          : "—",
      unit: "°C",
      icon: <WiThermometer className="text-3xl text-orange-400 icon-thermo" />,
      status: getTempStatus(healthCheck.temperature),
      color: "from-orange-500/20 to-orange-600/5",
      border: "border-orange-500/30",
      accent: "text-orange-400",
    },
    {
      label: "Weight",
      value: healthCheck.weight > 0 ? healthCheck.weight.toFixed(1) : "—",
      unit: "kg",
      icon: <FaWeight className="text-2xl text-violet-400 icon-float" />,
      status: healthCheck.weight > 0 ? "Measured" : "—",
      color: "from-violet-500/20 to-violet-600/5",
      border: "border-violet-500/30",
      accent: "text-violet-400",
    },
    {
      label: "Height",
      value: healthCheck.height > 0 ? healthCheck.height.toFixed(0) : "—",
      unit: "cm",
      icon: <FaRulerVertical className="text-2xl text-pink-400 icon-ruler" />,
      status: healthCheck.height > 0 ? "Measured" : "—",
      color: "from-pink-500/20 to-pink-600/5",
      border: "border-pink-500/30",
      accent: "text-pink-400",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden px-4 py-12 flex items-center justify-center">
      <style>{iconAnimationStyles}</style>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-20 flex flex-col items-center gap-10 w-full max-w-4xl">

        <div className="w-full">
          <h2 className="text-white text-lg font-semibold mb-4 tracking-wide flex items-center gap-2">
            <TbActivityHeartbeat className="text-xl text-rose-400 icon-heading" />
            Health Check
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
            {healthCards.map((card) => (
              <div
                key={card.label}
                className={cn(
                  "rounded-2xl border p-5 backdrop-blur bg-gradient-to-br",
                  card.color,
                  card.border
                )}
              >
                <div className="mb-2">{card.icon}</div>
                <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">
                  {card.label}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={cn("text-2xl font-bold", card.accent)}>
                    {card.value}
                  </span>
                  {card.value !== "—" && (
                    <span className="text-neutral-500 text-sm mb-0.5">
                      {card.unit}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-md",
                    card.status === "Normal" || card.status === "Measured"
                      ? "bg-green-500/20 text-green-400"
                      : card.status === "Low" || card.status === "Underweight"
                      ? "bg-blue-500/20 text-blue-400"
                      : card.status === "High" ||
                        card.status === "Fever" ||
                        card.status === "Critical" ||
                        card.status === "Obese"
                      ? "bg-red-500/20 text-red-400"
                      : card.status === "Overweight"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-neutral-500/20 text-neutral-400"
                  )}
                >
                  {card.status}
                </span>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "rounded-2xl border p-6 backdrop-blur bg-gradient-to-br",
              bmiInfo.bg,
              bmiInfo.border
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MdOutlineMonitorHeart className="text-base icon-bmi-ping" />
                  Smart BMI
                </p>
                <div className="flex items-end gap-2">
                  <span className={cn("text-5xl font-bold", bmiInfo.accent)}>
                    {bmi > 0 ? bmi : "—"}
                  </span>
                  <span className="text-neutral-500 text-sm mb-1">
                    kg/m²
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border self-start sm:self-auto",
                  bmiInfo.border,
                  "bg-black/30"
                )}
              >
                <BMIStatusIcon />
                <span className={cn("text-lg font-semibold", bmiInfo.accent)}>
                  {bmi > 0 ? bmiInfo.label : "No data"}
                </span>
              </div>
            </div>

            {/* Gender & Age Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Gender */}
              <div className="flex-1">
                <label className="text-neutral-500 text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  Gender
                </label>
                <div className="flex gap-2">
                  {["male", "female"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide border transition-all duration-200",
                        gender === g
                          ? g === "male"
                            ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                            : "bg-pink-500/20 border-pink-500/60 text-pink-300"
                          : "bg-white/5 border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                      )}
                    >
                      {g === "male" ? "♂ Male" : "♀ Female"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:w-40">
                <label className="text-neutral-500 text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age === 0 ? "" : age}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAge(isNaN(val) ? 0 : Math.min(120, Math.max(1, val)));
                    }}
                    placeholder="e.g. 25"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                  {age > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                      yrs
                    </span>
                  )}
                </div>
                {age > 0 && age < 18 && (
                  <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                    <MdWarning className="text-sm" /> Teen — standard BMI may vary
                  </p>
                )}
                {age >= 65 && (
                  <p className="text-violet-400 text-xs mt-1 flex items-center gap-1">
                    <MdCheckCircle className="text-sm" /> Senior — see tailored advice
                  </p>
                )}
              </div>
            </div>

            <div className="mb-2">
              <div className="flex rounded-full overflow-hidden h-3 w-full mb-2 gap-0.5">
                {bmiSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className={cn("flex-1 rounded-full", seg.color, "opacity-60")}
                  />
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
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        bmiInfo.label === seg.label
                          ? bmiInfo.accent
                          : "text-neutral-600"
                      )}
                    >
                      {seg.label}
                    </span>
                    <span className="text-neutral-600 text-xs">{seg.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <BMIRemarks bmi={bmi} age={age} gender={gender} />
          </div>
        </div>
      </div>
    </div>
  );
}