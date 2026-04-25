"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { database } from "../config/firebase";
import { ref, onValue } from "firebase/database";
import * as htmlToImage from 'html-to-image';

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
  MdFitnessCenter,
  MdRestaurantMenu,
} from "react-icons/md";
import { TbActivityHeartbeat, TbFlame, TbSalad, TbMeat, TbDroplet } from "react-icons/tb";
import { GiMeal, GiRunningShoe, GiWaterDrop, GiNightSleep, GiMuscleUp, GiBiceps } from "react-icons/gi";
import { FaUserDoctor, FaBolt } from "react-icons/fa6";
import { IoNutrition } from "react-icons/io5";
import { RiMentalHealthLine } from "react-icons/ri";
import { LuBrain, LuHeartPulse, LuThermometer, LuWind, LuApple, LuDumbbell, LuMoon, LuDroplets, LuTriangleAlert, LuCircleCheck, LuInfo, LuShieldAlert } from "react-icons/lu";

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
  @keyframes barFill {
    from { width: 0%; }
    to   { width: var(--target-width); }
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

// ─── All 100 meals from Diet_Plan_Final.csv ───────────────────────────────────
const DIET_DATA = [
  { id: 1,  name: "Tapsilog",                    portion: "1 cup Garlic Rice, 100g Beef, 1 Egg",          foodType: "breakfast", calories: 516, carbs: 26, proteins: 25, fats: 12 },
  { id: 2,  name: "Tocilog",                     portion: "1 cup Garlic Rice, 100g Tocino, 1 Egg",        foodType: "dinner",    calories: 561, carbs: 52, proteins: 20, fats: 18 },
  { id: 3,  name: "Longsilog",                   portion: "1 cup Garlic Rice, 2 pcs Longganisa, 1 Egg",   foodType: "breakfast", calories: 260, carbs: 49, proteins: 33, fats: 22 },
  { id: 4,  name: "Bangsilog",                   portion: "1 cup Garlic Rice, 1 medium Bangus, 1 Egg",    foodType: "breakfast", calories: 365, carbs: 32, proteins: 40, fats: 25 },
  { id: 5,  name: "Pandesal with Egg",           portion: "2 medium Pandesal, 1 Scrambled Egg",           foodType: "breakfast", calories: 630, carbs: 60, proteins: 35, fats: 13 },
  { id: 6,  name: "Champorado",                  portion: "1 bowl (approx 250ml)",                        foodType: "dinner",    calories: 435, carbs: 25, proteins: 17, fats: 10 },
  { id: 7,  name: "Lugaw with Egg",              portion: "1 bowl with 1 Hard-boiled Egg",                foodType: "lunch",     calories: 663, carbs: 36, proteins: 31, fats: 20 },
  { id: 8,  name: "Spamsilog",                   portion: "1 cup Garlic Rice, 2 slices Spam, 1 Egg",      foodType: "breakfast", calories: 568, carbs: 32, proteins: 27, fats: 15 },
  { id: 9,  name: "Arroz Caldo",                 portion: "1 bowl with Chicken and Egg",                  foodType: "lunch",     calories: 452, carbs: 58, proteins: 29, fats: 22 },
  { id: 10, name: "Tortang Talong",              portion: "1 medium Eggplant with 1 Egg",                 foodType: "lunch",     calories: 429, carbs: 59, proteins: 30, fats: 25 },
  { id: 11, name: "Chicken Adobo",               portion: "150g Chicken, 1/2 cup Sauce",                  foodType: "lunch",     calories: 303, carbs: 48, proteins: 28, fats: 20 },
  { id: 12, name: "Pork Sinigang",               portion: "150g Pork, 1 cup Broth with Veggies",          foodType: "dinner",    calories: 650, carbs: 41, proteins: 28, fats: 8  },
  { id: 13, name: "Beef Kare-Kare",              portion: "150g Beef, 2 tbsp Peanut Sauce",               foodType: "lunch",     calories: 668, carbs: 30, proteins: 24, fats: 12 },
  { id: 14, name: "Pinakbet",                    portion: "1 cup Mixed Vegetables",                       foodType: "lunch",     calories: 596, carbs: 56, proteins: 16, fats: 20 },
  { id: 15, name: "Bicol Express",               portion: "150g Pork in Coconut Milk",                    foodType: "dinner",    calories: 614, carbs: 48, proteins: 27, fats: 24 },
  { id: 16, name: "Ginisang Monggo",             portion: "1 cup cooked Mung Beans",                      foodType: "dinner",    calories: 261, carbs: 53, proteins: 32, fats: 11 },
  { id: 17, name: "Lechon Kawali",               portion: "100g Crispy Pork Belly",                       foodType: "dinner",    calories: 265, carbs: 20, proteins: 26, fats: 21 },
  { id: 18, name: "Chopsuey",                    portion: "1.5 cups Stir-fried Vegetables",               foodType: "dinner",    calories: 669, carbs: 21, proteins: 33, fats: 25 },
  { id: 19, name: "Chicken Inasal",              portion: "1 Quarter Leg (approx 200g)",                  foodType: "lunch",     calories: 451, carbs: 50, proteins: 39, fats: 19 },
  { id: 20, name: "Pancit Canton",               portion: "1.5 cups cooked Noodles",                      foodType: "dinner",    calories: 570, carbs: 39, proteins: 36, fats: 14 },
  { id: 21, name: "Lumpia Shanghai",             portion: "5 small pieces",                               foodType: "lunch",     calories: 413, carbs: 44, proteins: 39, fats: 17 },
  { id: 22, name: "Tinola na Manok",             portion: "150g Chicken, 1 cup Broth",                    foodType: "dinner",    calories: 375, carbs: 25, proteins: 36, fats: 10 },
  { id: 23, name: "Grilled Liempo",              portion: "150g Grilled Pork Belly",                      foodType: "dinner",    calories: 659, carbs: 32, proteins: 24, fats: 15 },
  { id: 24, name: "Beef Pares",                  portion: "150g Beef Stew, 1 cup Rice",                   foodType: "dinner",    calories: 424, carbs: 49, proteins: 19, fats: 25 },
  { id: 25, name: "Dinuguan",                    portion: "1 cup Pork Blood Stew",                        foodType: "dinner",    calories: 649, carbs: 21, proteins: 38, fats: 15 },
  { id: 26, name: "Bangus Sisig",                portion: "150g Flaked Milkfish",                         foodType: "dinner",    calories: 626, carbs: 54, proteins: 40, fats: 22 },
  { id: 27, name: "Grilled Tilapia",             portion: "1 whole medium fish",                          foodType: "dinner",    calories: 508, carbs: 51, proteins: 34, fats: 6  },
  { id: 28, name: "Beef Caldereta",              portion: "150g Beef in Tomato Sauce",                    foodType: "dinner",    calories: 305, carbs: 25, proteins: 19, fats: 8  },
  { id: 29, name: "Nilagang Baka",               portion: "150g Beef, 1 cup Broth",                       foodType: "dinner",    calories: 468, carbs: 44, proteins: 22, fats: 16 },
  { id: 30, name: "Pork Menudo",                 portion: "150g Pork and Liver mix",                      foodType: "dinner",    calories: 450, carbs: 60, proteins: 32, fats: 22 },
  { id: 31, name: "Fish Steak",                  portion: "150g Fish fillet (Bistek style)",               foodType: "dinner",    calories: 570, carbs: 48, proteins: 32, fats: 12 },
  { id: 32, name: "Laing",                       portion: "1 cup Taro Leaves in Coconut Milk",            foodType: "lunch",     calories: 625, carbs: 24, proteins: 26, fats: 19 },
  { id: 33, name: "Ginataang Kalabasa",          portion: "1 cup Squash and Beans",                       foodType: "dinner",    calories: 333, carbs: 20, proteins: 23, fats: 5  },
  { id: 34, name: "Pork Hamonado",               portion: "150g Sweetened Pork",                          foodType: "dinner",    calories: 264, carbs: 39, proteins: 39, fats: 18 },
  { id: 35, name: "Adobong Sitaw",               portion: "1 cup String Beans with Pork",                 foodType: "lunch",     calories: 541, carbs: 47, proteins: 23, fats: 11 },
  { id: 36, name: "Mechado",                     portion: "150g Beef with Potato",                        foodType: "dinner",    calories: 384, carbs: 47, proteins: 15, fats: 21 },
  { id: 37, name: "Afritada",                    portion: "150g Chicken/Pork with Tomato",                foodType: "lunch",     calories: 364, carbs: 31, proteins: 19, fats: 22 },
  { id: 38, name: "Pork Steak",                  portion: "150g Pork Loin slices",                        foodType: "dinner",    calories: 542, carbs: 31, proteins: 18, fats: 12 },
  { id: 39, name: "Sinigang na Hipon",           portion: "6 medium Shrimp, 1 cup Broth",                 foodType: "lunch",     calories: 682, carbs: 34, proteins: 39, fats: 25 },
  { id: 40, name: "Inihaw na Pusit",             portion: "1 medium Grilled Squid",                       foodType: "lunch",     calories: 635, carbs: 42, proteins: 23, fats: 17 },
  { id: 41, name: "Oatmeal",                     portion: "1 cup cooked with honey",                      foodType: "dinner",    calories: 270, carbs: 21, proteins: 29, fats: 9  },
  { id: 42, name: "Scrambled Eggs",              portion: "3 large eggs with spinach",                    foodType: "dinner",    calories: 320, carbs: 34, proteins: 36, fats: 24 },
  { id: 43, name: "Greek Yogurt",                portion: "170g container",                               foodType: "breakfast", calories: 353, carbs: 45, proteins: 22, fats: 11 },
  { id: 44, name: "Avocado Toast",               portion: "1 slice sourdough, 1/2 avocado",               foodType: "breakfast", calories: 590, carbs: 53, proteins: 27, fats: 25 },
  { id: 45, name: "Protein Smoothie",            portion: "1 scoop whey, 1 cup milk/water",               foodType: "lunch",     calories: 688, carbs: 40, proteins: 27, fats: 25 },
  { id: 46, name: "Grilled Chicken Breast",      portion: "150g skinless",                                foodType: "breakfast", calories: 597, carbs: 56, proteins: 28, fats: 19 },
  { id: 47, name: "Quinoa Salad",                portion: "1 cup cooked with veggies",                    foodType: "lunch",     calories: 649, carbs: 47, proteins: 25, fats: 20 },
  { id: 48, name: "Turkey Wrap",                 portion: "1 whole wheat tortilla, 100g turkey",          foodType: "lunch",     calories: 607, carbs: 23, proteins: 31, fats: 25 },
  { id: 49, name: "Baked Salmon",                portion: "150g fillet",                                  foodType: "lunch",     calories: 379, carbs: 29, proteins: 26, fats: 14 },
  { id: 50, name: "Steak Salad",                 portion: "100g Sirloin, 3 cups greens",                  foodType: "lunch",     calories: 521, carbs: 47, proteins: 19, fats: 6  },
  { id: 51, name: "Steamed Sinigang na Hipon",   portion: "6 medium Shrimp, 1 cup Broth",                 foodType: "breakfast", calories: 611, carbs: 27, proteins: 25, fats: 13 },
  { id: 52, name: "Baked Lumpia Shanghai",       portion: "5 small pieces",                               foodType: "lunch",     calories: 664, carbs: 39, proteins: 32, fats: 17 },
  { id: 53, name: "Homemade Lechon Kawali",      portion: "100g Crispy Pork Belly",                       foodType: "dinner",    calories: 251, carbs: 48, proteins: 21, fats: 20 },
  { id: 54, name: "Grilled Bicol Express",       portion: "150g Pork in Coconut Milk",                    foodType: "breakfast", calories: 668, carbs: 22, proteins: 28, fats: 22 },
  { id: 55, name: "Steamed Grilled Liempo",      portion: "150g Grilled Pork Belly",                      foodType: "lunch",     calories: 567, carbs: 39, proteins: 33, fats: 17 },
  { id: 56, name: "Baked Mechado",               portion: "150g Beef with Potato",                        foodType: "breakfast", calories: 664, carbs: 28, proteins: 17, fats: 17 },
  { id: 57, name: "Grilled Pork Sinigang",       portion: "150g Pork, 1 cup Broth with Veggies",          foodType: "dinner",    calories: 690, carbs: 52, proteins: 24, fats: 21 },
  { id: 58, name: "Fresh Laing",                 portion: "1 cup Taro Leaves in Coconut Milk",            foodType: "lunch",     calories: 308, carbs: 26, proteins: 37, fats: 20 },
  { id: 59, name: "Fresh Tocilog",               portion: "1 cup Garlic Rice, 100g Tocino, 1 Egg",        foodType: "dinner",    calories: 605, carbs: 36, proteins: 32, fats: 11 },
  { id: 60, name: "Classic Chicken Adobo",       portion: "150g Chicken, 1/2 cup Sauce",                  foodType: "breakfast", calories: 330, carbs: 31, proteins: 27, fats: 11 },
  { id: 61, name: "Steamed Bangus Sisig",        portion: "150g Flaked Milkfish",                         foodType: "breakfast", calories: 464, carbs: 28, proteins: 34, fats: 25 },
  { id: 62, name: "Classic Ginisang Monggo",     portion: "1 cup cooked Mung Beans",                      foodType: "breakfast", calories: 420, carbs: 39, proteins: 26, fats: 21 },
  { id: 63, name: "Fresh Ginisang Monggo",       portion: "1 cup cooked Mung Beans",                      foodType: "breakfast", calories: 302, carbs: 25, proteins: 16, fats: 16 },
  { id: 64, name: "Spicy Nilagang Baka",         portion: "150g Beef, 1 cup Broth",                       foodType: "breakfast", calories: 535, carbs: 38, proteins: 37, fats: 10 },
  { id: 65, name: "Steamed Spamsilog",           portion: "1 cup Garlic Rice, 2 slices Spam, 1 Egg",      foodType: "lunch",     calories: 366, carbs: 32, proteins: 37, fats: 24 },
  { id: 66, name: "Classic Pork Steak",          portion: "150g Pork Loin slices",                        foodType: "lunch",     calories: 601, carbs: 27, proteins: 33, fats: 10 },
  { id: 67, name: "Steamed Grilled Tilapia",     portion: "1 whole medium fish",                          foodType: "breakfast", calories: 330, carbs: 37, proteins: 22, fats: 25 },
  { id: 68, name: "Grilled Pork Menudo",         portion: "150g Pork and Liver mix",                      foodType: "breakfast", calories: 596, carbs: 42, proteins: 30, fats: 23 },
  { id: 69, name: "Roasted Bangus Sisig",        portion: "150g Flaked Milkfish",                         foodType: "lunch",     calories: 625, carbs: 41, proteins: 25, fats: 17 },
  { id: 70, name: "Steamed Grilled Chicken Breast", portion: "150g skinless",                             foodType: "dinner",    calories: 431, carbs: 58, proteins: 26, fats: 17 },
  { id: 71, name: "Grilled Grilled Liempo",      portion: "150g Grilled Pork Belly",                      foodType: "lunch",     calories: 619, carbs: 58, proteins: 19, fats: 19 },
  { id: 72, name: "Grilled Greek Yogurt",        portion: "170g container",                               foodType: "dinner",    calories: 418, carbs: 39, proteins: 36, fats: 20 },
  { id: 73, name: "Classic Pork Sinigang",       portion: "150g Pork, 1 cup Broth with Veggies",          foodType: "dinner",    calories: 275, carbs: 40, proteins: 33, fats: 21 },
  { id: 74, name: "Steamed Bicol Express",       portion: "150g Pork in Coconut Milk",                    foodType: "lunch",     calories: 596, carbs: 27, proteins: 24, fats: 11 },
  { id: 75, name: "Roasted Greek Yogurt",        portion: "170g container",                               foodType: "lunch",     calories: 418, carbs: 41, proteins: 38, fats: 21 },
  { id: 76, name: "Roasted Ginisang Monggo",     portion: "1 cup cooked Mung Beans",                      foodType: "dinner",    calories: 651, carbs: 59, proteins: 26, fats: 6  },
  { id: 77, name: "Classic Greek Yogurt",        portion: "170g container",                               foodType: "breakfast", calories: 565, carbs: 51, proteins: 25, fats: 12 },
  { id: 78, name: "Spicy Laing",                 portion: "1 cup Taro Leaves in Coconut Milk",            foodType: "dinner",    calories: 624, carbs: 48, proteins: 35, fats: 21 },
  { id: 79, name: "Baked Inihaw na Pusit",       portion: "1 medium Grilled Squid",                       foodType: "lunch",     calories: 327, carbs: 40, proteins: 29, fats: 25 },
  { id: 80, name: "Spicy Beef Kare-Kare",        portion: "150g Beef, 2 tbsp Peanut Sauce",               foodType: "dinner",    calories: 426, carbs: 49, proteins: 20, fats: 17 },
  { id: 81, name: "Roasted Laing",               portion: "1 cup Taro Leaves in Coconut Milk",            foodType: "dinner",    calories: 571, carbs: 27, proteins: 35, fats: 20 },
  { id: 82, name: "Steamed Dinuguan",            portion: "1 cup Pork Blood Stew",                        foodType: "breakfast", calories: 495, carbs: 22, proteins: 32, fats: 10 },
  { id: 83, name: "Classic Turkey Wrap",         portion: "1 whole wheat tortilla, 100g turkey",          foodType: "dinner",    calories: 696, carbs: 30, proteins: 27, fats: 15 },
  { id: 84, name: "Roasted Tortang Talong",      portion: "1 medium Eggplant with 1 Egg",                 foodType: "breakfast", calories: 632, carbs: 37, proteins: 34, fats: 5  },
  { id: 85, name: "Grilled Tapsilog",            portion: "1 cup Garlic Rice, 100g Beef, 1 Egg",          foodType: "breakfast", calories: 623, carbs: 32, proteins: 35, fats: 7  },
  { id: 86, name: "Spicy Pork Steak",            portion: "150g Pork Loin slices",                        foodType: "lunch",     calories: 483, carbs: 24, proteins: 37, fats: 20 },
  { id: 87, name: "Steamed Tapsilog",            portion: "1 cup Garlic Rice, 100g Beef, 1 Egg",          foodType: "lunch",     calories: 319, carbs: 33, proteins: 38, fats: 12 },
  { id: 88, name: "Roasted Beef Pares",          portion: "150g Beef Stew, 1 cup Rice",                   foodType: "breakfast", calories: 504, carbs: 29, proteins: 22, fats: 14 },
  { id: 89, name: "Homemade Tinola na Manok",    portion: "150g Chicken, 1 cup Broth",                    foodType: "breakfast", calories: 651, carbs: 49, proteins: 29, fats: 19 },
  { id: 90, name: "Roasted Tinola na Manok",     portion: "150g Chicken, 1 cup Broth",                    foodType: "dinner",    calories: 690, carbs: 46, proteins: 30, fats: 20 },
  { id: 91, name: "Homemade Nilagang Baka",      portion: "150g Beef, 1 cup Broth",                       foodType: "lunch",     calories: 373, carbs: 46, proteins: 23, fats: 14 },
  { id: 92, name: "Baked Ginisang Monggo",       portion: "1 cup cooked Mung Beans",                      foodType: "breakfast", calories: 360, carbs: 48, proteins: 34, fats: 20 },
  { id: 93, name: "Steamed Inihaw na Pusit",     portion: "1 medium Grilled Squid",                       foodType: "breakfast", calories: 512, carbs: 48, proteins: 25, fats: 5  },
  { id: 94, name: "Homemade Quinoa Salad",       portion: "1 cup cooked with veggies",                    foodType: "breakfast", calories: 358, carbs: 54, proteins: 38, fats: 15 },
  { id: 95, name: "Homemade Laing",              portion: "1 cup Taro Leaves in Coconut Milk",            foodType: "dinner",    calories: 480, carbs: 47, proteins: 27, fats: 23 },
  { id: 96, name: "Roasted Mechado",             portion: "150g Beef with Potato",                        foodType: "breakfast", calories: 314, carbs: 21, proteins: 27, fats: 14 },
  { id: 97, name: "Homemade Pork Sinigang",      portion: "150g Pork, 1 cup Broth with Veggies",          foodType: "breakfast", calories: 398, carbs: 31, proteins: 16, fats: 16 },
  { id: 98, name: "Grilled Beef Pares",          portion: "150g Beef Stew, 1 cup Rice",                   foodType: "dinner",    calories: 627, carbs: 41, proteins: 35, fats: 25 },
  { id: 99, name: "Classic Oatmeal",             portion: "1 cup cooked with honey",                      foodType: "dinner",    calories: 606, carbs: 26, proteins: 37, fats: 11 },
  { id: 100, name: "Homemade Inihaw na Pusit",   portion: "1 medium Grilled Squid",                       foodType: "dinner",    calories: 605, carbs: 29, proteins: 23, fats: 24 },
];


// ─── All 40 exercises from Exercise Plan ─────────────────────────────────────
const EXERCISE_DATA = [
  { id: 1,  name: "Plank",                exerciseType: "Core",    setsDuration: "3 sets · 1 min",    intensityScore: 2 },
  { id: 2,  name: "Russian Twists",       exerciseType: "Core",    setsDuration: "3 sets · 20 reps",  intensityScore: 3 },
  { id: 3,  name: "Leg Raises",           exerciseType: "Core",    setsDuration: "3 sets · 15 reps",  intensityScore: 3 },
  { id: 4,  name: "Deadbugs",             exerciseType: "Core",    setsDuration: "3 sets · 12 reps",  intensityScore: 2 },
  { id: 5,  name: "Bird Dog",             exerciseType: "Core",    setsDuration: "3 sets · 12 reps",  intensityScore: 2 },
  { id: 6,  name: "Hollow Body Hold",     exerciseType: "Core",    setsDuration: "3 sets · 45 sec",   intensityScore: 3 },
  { id: 7,  name: "V-Ups",               exerciseType: "Core",    setsDuration: "3 sets · 10 reps",  intensityScore: 4 },
  { id: 8,  name: "Mountain Climbers",    exerciseType: "Core",    setsDuration: "3 sets · 30 sec",   intensityScore: 4 },
  { id: 9,  name: "Side Plank",           exerciseType: "Core",    setsDuration: "3 sets · 45 sec",   intensityScore: 3 },
  { id: 10, name: "Crunches",             exerciseType: "Core",    setsDuration: "3 sets · 20 reps",  intensityScore: 2 },
  { id: 11, name: "Squats",               exerciseType: "Lower",   setsDuration: "4 sets · 12 reps",  intensityScore: 3 },
  { id: 12, name: "Lunges",               exerciseType: "Lower",   setsDuration: "3 sets · 10 reps",  intensityScore: 3 },
  { id: 13, name: "Deadlifts",            exerciseType: "Lower",   setsDuration: "4 sets · 8 reps",   intensityScore: 5 },
  { id: 14, name: "Glute Bridges",        exerciseType: "Lower",   setsDuration: "3 sets · 15 reps",  intensityScore: 2 },
  { id: 15, name: "Calf Raises",          exerciseType: "Lower",   setsDuration: "4 sets · 20 reps",  intensityScore: 2 },
  { id: 16, name: "Leg Press",            exerciseType: "Lower",   setsDuration: "3 sets · 12 reps",  intensityScore: 3 },
  { id: 17, name: "Step-ups",             exerciseType: "Lower",   setsDuration: "3 sets · 10 reps",  intensityScore: 3 },
  { id: 18, name: "Bulgarian Split Squat",exerciseType: "Lower",   setsDuration: "3 sets · 8 reps",   intensityScore: 4 },
  { id: 19, name: "Leg Curls",            exerciseType: "Lower",   setsDuration: "3 sets · 12 reps",  intensityScore: 3 },
  { id: 20, name: "Box Jumps",            exerciseType: "Lower",   setsDuration: "3 sets · 10 reps",  intensityScore: 5 },
  { id: 21, name: "Push-ups",             exerciseType: "Upper",   setsDuration: "3 sets · 15 reps",  intensityScore: 2 },
  { id: 22, name: "Pull-ups",             exerciseType: "Upper",   setsDuration: "3 sets · 8 reps",   intensityScore: 5 },
  { id: 23, name: "Shoulder Press",       exerciseType: "Upper",   setsDuration: "3 sets · 12 reps",  intensityScore: 3 },
  { id: 24, name: "Bicep Curls",          exerciseType: "Upper",   setsDuration: "3 sets · 12 reps",  intensityScore: 2 },
  { id: 25, name: "Tricep Dips",          exerciseType: "Upper",   setsDuration: "3 sets · 12 reps",  intensityScore: 3 },
  { id: 26, name: "Bent Over Rows",       exerciseType: "Upper",   setsDuration: "3 sets · 10 reps",  intensityScore: 4 },
  { id: 27, name: "Bench Press",          exerciseType: "Upper",   setsDuration: "4 sets · 8 reps",   intensityScore: 4 },
  { id: 28, name: "Lat Pulldown",         exerciseType: "Upper",   setsDuration: "3 sets · 12 reps",  intensityScore: 3 },
  { id: 29, name: "Lateral Raises",       exerciseType: "Upper",   setsDuration: "3 sets · 15 reps",  intensityScore: 2 },
  { id: 30, name: "Face Pulls",           exerciseType: "Upper",   setsDuration: "3 sets · 15 reps",  intensityScore: 2 },
  { id: 31, name: "Running",              exerciseType: "Cardio",  setsDuration: "30 mins",            intensityScore: 4 },
  { id: 32, name: "Swimming",             exerciseType: "Cardio",  setsDuration: "20 mins",            intensityScore: 3 },
  { id: 33, name: "Cycling",              exerciseType: "Cardio",  setsDuration: "45 mins",            intensityScore: 3 },
  { id: 34, name: "Jump Rope",            exerciseType: "Cardio",  setsDuration: "15 mins",            intensityScore: 4 },
  { id: 35, name: "Burpees",              exerciseType: "Cardio",  setsDuration: "3 sets · 10 reps",  intensityScore: 5 },
  { id: 36, name: "Rowing",              exerciseType: "Cardio",  setsDuration: "20 mins",            intensityScore: 4 },
  { id: 37, name: "High Knees",           exerciseType: "Cardio",  setsDuration: "5 sets · 30 sec",   intensityScore: 4 },
  { id: 38, name: "Stair Climber",        exerciseType: "Cardio",  setsDuration: "15 mins",            intensityScore: 3 },
  { id: 39, name: "Elliptical",           exerciseType: "Cardio",  setsDuration: "30 mins",            intensityScore: 2 },
  { id: 40, name: "Battle Ropes",         exerciseType: "Cardio",  setsDuration: "5 sets · 30 sec",   intensityScore: 5 },
];

// ─── Exercise Matching Engine ─────────────────────────────────────────────────
// intensityScore key:
//   1-2 = light/recovery  (good for cut/sedentary/obese)
//   3   = moderate         (good for maintain/light-moderate activity)
//   4-5 = intense          (good for bulk/athlete/heavy)

function getExerciseProfile(goal: string, activityKey: string, bmi: number) {
  // Target intensity range based on goal + activity
  const intensityTarget =
    goal === "cut" && (activityKey === "sedentary" || bmi >= 30) ? 2 :
    goal === "cut" ? 3 :
    goal === "bulk" && (activityKey === "athlete" || activityKey === "heavy") ? 5 :
    goal === "bulk" ? 4 :
    activityKey === "sedentary" ? 2 :
    activityKey === "light" ? 3 :
    activityKey === "moderate" ? 3 :
    activityKey === "heavy" ? 4 :
    4; // athlete

  // How many of each type to recommend
  const typeCount =
    goal === "cut"  ? { Core: 2, Lower: 2, Upper: 2, Cardio: 3 } :
    goal === "bulk" ? { Core: 2, Lower: 3, Upper: 3, Cardio: 1 } :
                     { Core: 2, Lower: 2, Upper: 2, Cardio: 2 };

  return { intensityTarget, typeCount };
}

function findMatchingExercises(
  goal: string,
  activityKey: string,
  bmi: number
): Record<string, typeof EXERCISE_DATA> {
  const { intensityTarget, typeCount } = getExerciseProfile(goal, activityKey, bmi);

  const types = ["Core", "Lower", "Upper", "Cardio"] as const;
  const result: Record<string, typeof EXERCISE_DATA> = {};

  for (const type of types) {
    const pool = EXERCISE_DATA.filter(e => e.exerciseType === type);
    // Sort by closest intensity score to target
    const sorted = pool
      .map(e => ({ ...e, diff: Math.abs(e.intensityScore - intensityTarget) }))
      .sort((a, b) => a.diff - b.diff || a.id - b.id);
    result[type] = sorted.slice(0, typeCount[type]);
  }

  return result;
}

// ─── Exercise Section Component ───────────────────────────────────────────────
function ExerciseSection({
  goal,
  tdee,
  activityKey,
  bmi,
}: {
  goal: string;
  tdee: number;
  activityKey: string;
  bmi: number;
}) {
  const [activeType, setActiveType] = useState<string>("Core");

  if (!goal || !tdee) return null;

  const matched = findMatchingExercises(goal, activityKey, bmi);

  const typeConfig = {
    Core:   { color: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", activeBg: "bg-violet-500/20", icon: "🧘" },
    Lower:  { color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10", activeBg: "bg-orange-500/20", icon: "🦵" },
    Upper:  { color: "text-sky-400",    border: "border-sky-500/40",    bg: "bg-sky-500/10",    activeBg: "bg-sky-500/20",    icon: "💪" },
    Cardio: { color: "text-rose-400",   border: "border-rose-500/40",   bg: "bg-rose-500/10",   activeBg: "bg-rose-500/20",   icon: "🏃" },
  } as const;

  const intensityLabel = (score: number) =>
    score <= 2 ? { label: "Light",    cls: "bg-sky-500/20 text-sky-400 border-sky-500/30"      } :
    score === 3 ? { label: "Moderate", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" } :
    score === 4 ? { label: "Hard",     cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" } :
                  { label: "Intense",  cls: "bg-red-500/20 text-red-400 border-red-500/30"      };

  const goalLabel =
    goal === "cut"  ? { text: "Fat Burn Focus — Cardio-heavy, moderate strength", color: "text-rose-400"    } :
    goal === "bulk" ? { text: "Muscle Build Focus — Strength-heavy, minimal cardio", color: "text-emerald-400" } :
                     { text: "Balanced Training — Even split across all types",     color: "text-sky-400"    };

  const totalExercises = Object.values(matched).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="space-y-5">
      {/* Goal banner */}
      <div className="rounded-xl border border-white/10 bg-neutral-900/60 px-4 py-3 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">Training Focus</p>
          <p className={cn("text-sm font-semibold", goalLabel.color)}>{goalLabel.text}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">Today's Plan</p>
          <p className="text-sm font-semibold text-white">{totalExercises} exercises selected</p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="grid grid-cols-4 gap-2">
        {(["Core", "Lower", "Upper", "Cardio"] as const).map(type => {
          const cfg    = typeConfig[type];
          const isActive = activeType === type;
          const count  = matched[type]?.length ?? 0;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-all duration-200",
                isActive ? cn(cfg.activeBg, cfg.border, cfg.color) : "border-white/10 bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
              )}
            >
              <div className="text-lg mb-1">{cfg.icon}</div>
              <p className="text-xs font-semibold">{type}</p>
              <p className="text-xs opacity-60">{count} exercises</p>
            </button>
          );
        })}
      </div>

      {/* Exercise cards for active type */}
      <div className="space-y-3">
        {(matched[activeType] ?? []).map((ex, idx) => {
          const cfg = typeConfig[activeType as keyof typeof typeConfig];
          const lvl = intensityLabel(ex.intensityScore);
          return (
            <div
              key={ex.id}
              className={cn(
                "rounded-xl border p-4 flex items-center gap-4 transition-all",
                idx === 0 ? cn(cfg.bg, cfg.border, "ring-1", cfg.border.replace("border-", "ring-")) : "border-white/10 bg-neutral-900"
              )}
            >
              {/* Rank number */}
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                idx === 0 ? cn(cfg.activeBg, cfg.color) : "bg-white/5 text-neutral-500"
              )}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-white font-semibold text-sm">{ex.name}</p>
                  {idx === 0 && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", cfg.bg, cfg.border, cfg.color)}>
                      ✓ Best Match
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{ex.setsDuration}</p>
              </div>

              {/* Intensity badge */}
              <div className="shrink-0 text-right">
                <span className={cn("text-xs px-2 py-1 rounded-lg border font-semibold", lvl.cls)}>
                  {lvl.label}
                </span>
                {/* Intensity dots */}
                <div className="flex gap-0.5 mt-1.5 justify-end">
                  {[1, 2, 3, 4, 5].map(dot => (
                    <div
                      key={dot}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        dot <= ex.intensityScore
                          ? ex.intensityScore <= 2 ? "bg-sky-400"
                          : ex.intensityScore === 3 ? "bg-yellow-400"
                          : ex.intensityScore === 4 ? "bg-orange-400"
                          : "bg-red-400"
                          : "bg-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full plan summary at bottom */}
      <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-medium">Full Week Snapshot</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["Core", "Lower", "Upper", "Cardio"] as const).map(type => {
            const cfg   = typeConfig[type];
            const items = matched[type] ?? [];
            return (
              <div key={type} className={cn("rounded-xl border p-3", cfg.bg, cfg.border)}>
                <p className={cn("text-xs font-semibold mb-2 flex items-center gap-1.5", cfg.color)}>
                  <span>{cfg.icon}</span> {type}
                </p>
                <ul className="space-y-1">
                  {items.map(e => (
                    <li key={e.id} className="text-xs text-neutral-400 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-neutral-600 shrink-0" />
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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

function getSpo2Status(v: number)   { if (!v) return "—"; if (v >= 95) return "Normal"; if (v >= 90) return "Low"; return "Critical"; }
function getHeartRateStatus(v: number) { if (!v) return "—"; if (v >= 60 && v <= 100) return "Normal"; if (v < 60) return "Low"; return "High"; }
function getTempStatus(v: number)   { if (!v) return "—"; if (v >= 36.1 && v <= 37.2) return "Normal"; if (v < 36.1) return "Low"; return "Fever"; }

// ─── TDEE Calculations ──────────────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { key: "sedentary",  label: "Sedentary",        desc: "Little or no exercise",      multiplier: 1.2   },
  { key: "light",      label: "Light Exercise",    desc: "1–3 days/week",              multiplier: 1.375 },
  { key: "moderate",   label: "Moderate Exercise", desc: "3–5 days/week",              multiplier: 1.55  },
  { key: "heavy",      label: "Heavy Exercise",    desc: "6–7 days/week",              multiplier: 1.725 },
  { key: "athlete",    label: "Athlete",           desc: "2x training per day",        multiplier: 1.9   },
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
    hamwi:    Math.round(48.0 + 2.7 * inchesOver5ft),
    devine:   Math.round(50.0 + 2.3 * inchesOver5ft),
    robinson: Math.round(52.0 + 1.9 * inchesOver5ft),
    miller:   Math.round(56.2 + 1.41 * inchesOver5ft),
  };
  return {
    hamwi:    Math.round(45.5 + 2.2 * inchesOver5ft),
    devine:   Math.round(45.5 + 2.3 * inchesOver5ft),
    robinson: Math.round(49.0 + 1.7 * inchesOver5ft),
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

// ─── DIET_DATA Meal Matching Engine ────────────────────────────────────────────
// Scores each meal in DIET_DATA against calculated per-meal calorie & macro targets.
// Returns the top `limit` closest-matching meals for the given meal type.
function findMatchingMeals(
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  foodType: "breakfast" | "lunch" | "dinner",
  limit = 4
) {
  const pool = DIET_DATA.filter(m => m.foodType === foodType);

  const scored = pool.map(m => {
    // Calorie closeness (50% weight) — normalized distance
    const calScore = Math.abs(m.calories - targetCalories) / (targetCalories || 1);

    // Macro ratio closeness (50% weight) — compare proportions not raw grams
    const mTotal = (m.proteins + m.carbs + m.fats) || 1;
    const pRatio = m.proteins / mTotal;
    const cRatio = m.carbs    / mTotal;
    const fRatio = m.fats     / mTotal;

    const tTotal = (targetProtein + targetCarbs + targetFat) || 1;
    const pT = targetProtein / tTotal;
    const cT = targetCarbs   / tTotal;
    const fT = targetFat     / tTotal;

    const macroScore = (
      Math.abs(pRatio - pT) +
      Math.abs(cRatio - cT) +
      Math.abs(fRatio - fT)
    ) / 3;

    // Lower score = better match
    return { ...m, score: calScore * 0.5 + macroScore * 0.5 };
  });

  return scored.sort((a, b) => a.score - b.score).slice(0, limit);
}

// ─── Diet Section (TDEE-matched meals from DIET_DATA) ──────────────────────────
function DietSection({
  goal,
  tdee,
  weight,
  activityKey,
}: {
  goal: string;
  tdee: number;
  weight: number;
  activityKey: string;
}) {
  if (!goal || !tdee) return null;

  // Per-meal calorie target = TDEE ÷ 3 meals, adjusted by goal
  const baseMealCal = Math.round(tdee / 3);
  const calTarget =
    goal === "cut"  ? Math.round(baseMealCal * 0.85) :  // ~15% deficit per meal
    goal === "bulk" ? Math.round(baseMealCal * 1.15) :  // ~15% surplus per meal
    baseMealCal;

  // Protein target from activity level
  const proteinPerKg =
    activityKey === "athlete" || activityKey === "heavy" ? 2.0 :
    activityKey === "moderate" ? 1.8 : 1.6;
  const dailyProtein = weight > 0 ? weight * proteinPerKg : (tdee * 0.30) / 4;
  const dailyCarbs   = (tdee * 0.35) / 4;
  const dailyFat     = (tdee * 0.30) / 9;

  // Per-meal macro targets
  const mealProtein = Math.round(dailyProtein / 3);
  const mealCarbs   = Math.round(dailyCarbs   / 3);
  const mealFat     = Math.round(dailyFat     / 3);

  const mealTypes = ["breakfast", "lunch", "dinner"] as const;

  const goalLabel =
    goal === "cut"  ? "Fat Loss (−15% cal/meal)" :
    goal === "bulk" ? "Lean Bulk (+15% cal/meal)" :
    "Maintenance";

  const goalColor =
    goal === "cut"  ? "text-rose-400 bg-rose-500/10 border-rose-500/30" :
    goal === "bulk" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
    "text-sky-400 bg-sky-500/10 border-sky-500/30";

  return (
    <div className="space-y-6">
      {/* Goal + target summary banner */}
      <div className={cn("rounded-xl border px-4 py-3 flex flex-wrap items-center gap-4", goalColor)}>
        <div>
          <p className="text-xs opacity-60 mb-0.5 uppercase tracking-widest">Goal</p>
          <p className="text-sm font-semibold">{goalLabel}</p>
        </div>
        <div>
          <p className="text-xs opacity-60 mb-0.5 uppercase tracking-widest">TDEE</p>
          <p className="text-sm font-semibold">{tdee.toLocaleString()} cal/day</p>
        </div>
        <div>
          <p className="text-xs opacity-60 mb-0.5 uppercase tracking-widest">Per Meal Target</p>
          <p className="text-sm font-semibold">{calTarget} cal</p>
        </div>
        <div>
          <p className="text-xs opacity-60 mb-0.5 uppercase tracking-widest">Protein / Meal</p>
          <p className="text-sm font-semibold">{mealProtein}g</p>
        </div>
      </div>

      {mealTypes.map(type => {
        const meals = findMatchingMeals(
          calTarget,
          mealProtein,
          mealCarbs,
          mealFat,
          type,
          4
        );

        return (
          <div key={type}>
            <h3 className="text-white font-semibold mb-3 capitalize flex items-center gap-2">
              {type === "breakfast" ? "🌅" : type === "lunch" ? "☀️" : "🌙"} {type}
              <span className="text-xs text-neutral-500 font-normal">
                best matches for {calTarget} cal · P:{mealProtein}g · C:{mealCarbs}g · F:{mealFat}g
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meals.map((meal, idx) => {
                const calDiff    = meal.calories - calTarget;
                const fitPercent = Math.max(5, 100 - Math.round(Math.abs(calDiff) / (calTarget || 1) * 100));
                const isOver     = calDiff > 0;
                const isExact    = calDiff === 0;

                return (
                  <div
                    key={meal.id}
                    className={cn(
                      "bg-neutral-900 border rounded-xl p-4 transition-all",
                      idx === 0
                        ? "border-green-500/40 ring-1 ring-green-500/20"
                        : "border-white/10"
                    )}
                  >
                    {/* Best match badge for top result */}
                    {idx === 0 && (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 mb-2 font-semibold">
                        ✓ Best Match
                      </span>
                    )}

                    <p className="text-white font-semibold leading-snug">{meal.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 mb-2">{meal.portion}</p>

                    {/* Macro chips */}
                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md">
                        {meal.calories} cal
                      </span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md">
                        P: {meal.proteins}g
                      </span>
                      <span className="bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md">
                        C: {meal.carbs}g
                      </span>
                      <span className="bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-md">
                        F: {meal.fats}g
                      </span>
                    </div>

                    {/* Calorie fit bar */}
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          fitPercent >= 90 ? "bg-green-500" :
                          fitPercent >= 70 ? "bg-yellow-500" :
                          "bg-orange-500"
                        )}
                        style={{ width: `${fitPercent}%` }}
                      />
                    </div>
                    <p className={cn(
                      "text-xs",
                      isExact ? "text-green-400" :
                      isOver  ? "text-orange-400" :
                      "text-sky-400"
                    )}>
                      {isExact
                        ? "Exact calorie match"
                        : isOver
                        ? `+${calDiff} cal over target`
                        : `${Math.abs(calDiff)} cal under target`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TDEE Suggestions Engine ────────────────────────────────────────────────────

type GoalType = "cut" | "maintain" | "bulk" | "recomp";

interface TDEESuggestion {
  id: string;
  tag: "Goal" | "Calories" | "Macros" | "Activity" | "Meal Timing" | "Progress";
  tagColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  chips: { label: string; value: string; color: string }[];
  tips: string[];
}

function getRecommendedGoal(bmi: number, activityKey: string, gender: string): GoalType {
  if (bmi >= 27) return "cut";
  if (bmi < 18.5) return "bulk";
  if (bmi >= 23 && bmi < 27 && activityKey === "sedentary") return "cut";
  if (bmi >= 18.5 && bmi < 23) return activityKey === "sedentary" ? "maintain" : "bulk";
  return "maintain";
}

function buildTDEESuggestions(
  tdee: number,
  bmr: number,
  bmi: number,
  weight: number,
  age: number,
  gender: string,
  activityKey: string
): TDEESuggestion[] {
  if (!tdee || !bmr) return [];

  const goal = getRecommendedGoal(bmi, activityKey, gender);
  const results: TDEESuggestion[] = [];

  const cutCal     = tdee - 500;
  const mildCutCal = tdee - 300;
  const bulkCal    = tdee + 300;
  const aggrBulk   = tdee + 500;

  const proteinPerKg = activityKey === "athlete" || activityKey === "heavy" ? 2.0
    : activityKey === "moderate" ? 1.8
    : 1.6;
  const proteinG = weight > 0 ? Math.round(weight * proteinPerKg) : Math.round((tdee * 0.30) / 4);
  const proteinCal = proteinG * 4;

  // ── 1. Recommended Goal ──────────────────────────────────────────────────────
  const goalMap: Record<GoalType, { title: string; subtitle: string; color: string; calTarget: number; tips: string[] }> = {
    cut: {
      title: "Recommended Goal: Fat Loss (Cut)",
      subtitle: `Your BMI of ${bmi} and activity level suggest a calorie deficit is the best path right now.`,
      color: "text-rose-400",
      calTarget: cutCal,
      tips: [
        `Eat ${cutCal.toLocaleString()} cal/day — a 500 cal deficit from your TDEE of ${tdee.toLocaleString()}.`,
        "This targets ~0.45 kg (1 lb) of fat loss per week — the safest sustainable rate.",
        `Never go below ${Math.round(bmr).toLocaleString()} cal/day (your BMR) — that's your absolute floor.`,
        bmi >= 30 ? "With BMI ≥ 30, prioritize diet changes over intense exercise at first." : "Combine the deficit with 3–4 cardio sessions/week for best results.",
        gender === "female" ? "Women: avoid going below 1,200 cal/day even in aggressive cuts." : "Men: avoid going below 1,500 cal/day in aggressive cuts.",
      ],
    },
    maintain: {
      title: "Recommended Goal: Maintain & Optimize",
      subtitle: `Your BMI of ${bmi} is healthy. Focus on body recomposition — lose fat while building muscle.`,
      color: "text-green-400",
      calTarget: tdee,
      tips: [
        `Eat ${tdee.toLocaleString()} cal/day to stay at your current weight.`,
        "Shift focus to body composition: increase protein and resistance training.",
        "Small fluctuations of ±200 cal are fine — consistency over weeks matters most.",
        "Weigh yourself weekly (same day, same time) to track maintenance accurately.",
        "If weight drifts up >1 kg over 2 weeks, reduce by 200–300 cal temporarily.",
      ],
    },
    bulk: {
      title: "Recommended Goal: Lean Bulk",
      subtitle: `Your BMI of ${bmi} indicates you can benefit from a clean calorie surplus to build muscle.`,
      color: "text-emerald-400",
      calTarget: bulkCal,
      tips: [
        `Eat ${bulkCal.toLocaleString()} cal/day — a controlled +300 surplus over your TDEE.`,
        "A lean bulk minimizes fat gain while maximizing muscle growth.",
        bmi < 18 ? "Your BMI is very low — you may need an aggressive bulk of +500 cal." : "Avoid 'dirty bulking' — excess fat is harder to lose than muscle is to gain.",
        "Expect 0.25–0.5 kg of weight gain per week; more than that is likely fat.",
        "Track progress with measurements (chest, waist, arms) not just scale weight.",
      ],
    },
    recomp: {
      title: "Recommended Goal: Body Recomposition",
      subtitle: "Eat at maintenance while training hard — lose fat and gain muscle simultaneously.",
      color: "text-sky-400",
      calTarget: tdee,
      tips: [
        `Target ${tdee.toLocaleString()} cal/day and prioritize high protein intake.`,
        "Recomp works best for beginners, returning lifters, or those near healthy BMI.",
        "Progress is slower but you avoid the discomfort of a cut or dirty bulk.",
        "Requires consistent strength training 3–5×/week to signal muscle growth.",
        "Be patient — visible changes take 8–12 weeks minimum.",
      ],
    },
  };

  const g = goalMap[goal];
  results.push({
    id: "goal",
    tag: "Goal",
    tagColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    icon: <LuCircleCheck className="text-xl text-violet-400" />,
    title: g.title,
    subtitle: g.subtitle,
    chips: [
      { label: "Your TDEE",  value: `${tdee.toLocaleString()} cal`, color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "Target",     value: `${g.calTarget.toLocaleString()} cal`, color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
      { label: "Difference", value: g.calTarget === tdee ? "± 0 cal" : `${g.calTarget > tdee ? "+" : ""}${(g.calTarget - tdee).toLocaleString()} cal`, color: g.calTarget < tdee ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : g.calTarget > tdee ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-neutral-800 text-neutral-300 border-neutral-700" },
    ],
    tips: g.tips,
  });

  // ── 2. Calorie Breakdown ─────────────────────────────────────────────────────
  results.push({
    id: "calories",
    tag: "Calories",
    tagColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: <MdLocalFireDepartment className="text-xl text-orange-400" />,
    title: "Your Calorie Targets at a Glance",
    subtitle: "Based on your TDEE, here are the calorie ranges for each goal.",
    chips: [
      { label: "BMR (rest)",      value: `${Math.round(bmr).toLocaleString()} cal`, color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "TDEE (maintain)", value: `${tdee.toLocaleString()} cal`,             color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "Weekly burn",     value: `${(tdee * 7).toLocaleString()} cal`,        color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
    ],
    tips: [
      `🔥 Aggressive cut: ${(tdee - 750).toLocaleString()} cal/day (−750, max safe deficit — short-term only).`,
      `✂️  Moderate cut:   ${cutCal.toLocaleString()} cal/day (−500, targets ~0.45 kg/week fat loss).`,
      `🌿 Mild cut:        ${mildCutCal.toLocaleString()} cal/day (−300, slow & sustainable, less muscle loss).`,
      `⚖️  Maintenance:    ${tdee.toLocaleString()} cal/day (body composition focus).`,
      `📈 Lean bulk:       ${bulkCal.toLocaleString()} cal/day (+300, minimal fat gain).`,
      `💪 Aggressive bulk: ${aggrBulk.toLocaleString()} cal/day (+500, faster muscle gain, some fat expected).`,
      `🚫 Never below BMR: ${Math.round(bmr).toLocaleString()} cal/day (organ function minimum).`,
    ],
  });

  // ── 3. Protein Target ────────────────────────────────────────────────────────
  const fatG   = weight > 0 ? Math.round(weight * 0.8) : Math.round((tdee * 0.28) / 9);
  const carbsG = Math.round((tdee - proteinCal - fatG * 9) / 4);

  results.push({
    id: "macros",
    tag: "Macros",
    tagColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    icon: <IoNutrition className="text-xl text-sky-400" />,
    title: "Optimal Macro Targets for Your Goal",
    subtitle: `Based on ${tdee.toLocaleString()} cal TDEE, ${activityKey.replace(/([A-Z])/g, " $1")} activity, and ${gender || "your"} body.`,
    chips: [
      { label: "Protein", value: `${proteinG}g/day`,              color: "bg-red-500/20 text-red-300 border-red-500/30" },
      { label: "Fat",     value: `${fatG}g/day`,                  color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      { label: "Carbs",   value: `${Math.max(0, carbsG)}g/day`,   color: "bg-green-500/20 text-green-300 border-green-500/30" },
    ],
    tips: [
      `Protein: ${proteinG}g/day (${proteinPerKg}g per kg body weight) — prioritize this above all macros.`,
      `Fat: minimum ${fatG}g/day — essential for hormones, brain, and fat-soluble vitamins (A, D, E, K).`,
      `Carbs: ~${Math.max(0, carbsG)}g/day — your primary energy source; time them around workouts.`,
      goal === "cut"  ? "On a cut: keep protein high to preserve muscle. Let carbs flex down first, not fat." : "",
      goal === "bulk" ? "On a bulk: increase carbs, not fat — carbs drive muscle glycogen and performance." : "",
      "Best protein sources: chicken breast, eggs, fish, Greek yogurt, legumes, tofu.",
      `Fiber target: ${Math.round(tdee / 1000) * 14}g/day (14g per 1,000 cal) for gut health and satiety.`,
    ].filter(Boolean) as string[],
  });

  // ── 4. Activity Upgrade ──────────────────────────────────────────────────────
  const activityTips: Record<string, string[]> = {
    sedentary: [
      "You're currently sedentary — this is the highest-impact area to improve.",
      "Even upgrading to 'Light Exercise' adds ~268 cal/day to your TDEE.",
      "Start with 20–30 min walks, 5 days/week. No gym needed.",
      "Each activity level upgrade gives you more calories to work with while still losing fat.",
      "Goal: reach 'Moderate Exercise' within 6–8 weeks for best metabolic outcomes.",
    ],
    light: [
      "You're doing light exercise — great start. Next step: moderate.",
      "Upgrading to moderate adds ~268 more cal to your TDEE, giving you more dietary flexibility.",
      "Try 3 structured workouts/week: 2 strength + 1 cardio session.",
      "Add 2,000–3,000 steps/day to your current routine.",
    ],
    moderate: [
      "Solid activity level. You're burning enough to have real dietary flexibility.",
      "Consider adding one HIIT session/week to boost EPOC (post-exercise calorie burn).",
      "Your TDEE allows a comfortable 500 cal deficit while still eating well.",
      "At this level, periodization matters — cycle intensity to avoid plateaus.",
    ],
    heavy: [
      "High training load — your body needs fuel and recovery equally.",
      `At ${tdee.toLocaleString()} cal, you have room to eat well and still hit goals.`,
      "Ensure pre-workout carbs (30–60 min before) for performance.",
      "Post-workout window: 20–40g protein + 40–60g fast carbs within 45 min.",
      "Deload week every 4–6 weeks prevents overtraining and promotes adaptation.",
    ],
    athlete: [
      "Elite activity demands elite nutrition — treat food as fuel, not reward.",
      `${tdee.toLocaleString()} cal/day is your baseline; on heavy training days, add 200–400 cal.`,
      "Carb periodization: high carbs on training days, moderate on rest days.",
      "Sleep 8–9 hours — HGH peaks during slow-wave sleep, critical for recovery.",
      "Work with a sports dietitian to dial in precise targets for your sport.",
    ],
  };

  const currentActivity = ACTIVITY_LEVELS.find(a => a.key === activityKey)!;
  const nextActivity    = ACTIVITY_LEVELS[ACTIVITY_LEVELS.findIndex(a => a.key === activityKey) + 1];
  const calDiff         = nextActivity ? Math.round(bmr * nextActivity.multiplier) - tdee : 0;

  results.push({
    id: "activity",
    tag: "Activity",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: <LuDumbbell className="text-xl text-emerald-400" />,
    title: `Activity Level: ${currentActivity.label}`,
    subtitle: nextActivity
      ? `Upgrading to "${nextActivity.label}" would add ~${calDiff.toLocaleString()} cal to your daily TDEE.`
      : "You're at the highest activity level — focus on training quality and recovery.",
    chips: [
      { label: "Current TDEE", value: `${tdee.toLocaleString()} cal`,   color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      ...(nextActivity ? [{ label: `${nextActivity.label} TDEE`, value: `${(tdee + calDiff).toLocaleString()} cal`, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" }] : []),
      { label: "Multiplier",   value: `×${currentActivity.multiplier}`, color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
    ],
    tips: activityTips[activityKey] || [],
  });

  // ── 5. Meal Timing ───────────────────────────────────────────────────────────
  const mealCal  = Math.round(tdee / 4);
  const snackCal = Math.round(tdee * 0.1);

  results.push({
    id: "meal-timing",
    tag: "Meal Timing",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: <GiMeal className="text-xl text-amber-400" />,
    title: "Meal Timing & Distribution",
    subtitle: `Spread your ${tdee.toLocaleString()} calories across the day to manage hunger and energy.`,
    chips: [
      { label: "Per main meal", value: `~${mealCal.toLocaleString()} cal`, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      { label: "Per snack",     value: `~${snackCal.toLocaleString()} cal`, color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "Meals/day",     value: "3 + 1–2 snacks",                   color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
    ],
    tips: [
      `Breakfast (~${mealCal.toLocaleString()} cal): Include protein + complex carbs to fuel your morning.`,
      `Lunch (~${mealCal.toLocaleString()} cal): Biggest meal of the day — prioritize vegetables and lean protein.`,
      `Dinner (~${mealCal.toLocaleString()} cal): Moderate carbs, high protein, healthy fats.`,
      `Snacks (${snackCal}–${snackCal * 2} cal total): Greek yogurt, nuts, fruit, or protein shake.`,
      goal === "cut" ? "On a cut: eat more at breakfast/lunch, lighter at dinner to reduce nighttime fat storage." : "",
      "Pre-workout: ~30–60g carbs 1 hr before (banana, oats, rice cakes).",
      "Post-workout: 25–40g protein within 45 min (shake, chicken, eggs).",
      "Avoid eating <2 hrs before sleep — impairs sleep quality and digestion.",
    ].filter(Boolean) as string[],
  });

  // ── 6. Progress Tracking ─────────────────────────────────────────────────────
  const weeklyDeficit = goal === "cut" ? -500 * 7 : goal === "bulk" ? 300 * 7 : 0;
  const weeklyKg      = weeklyDeficit / 7700;

  results.push({
    id: "progress",
    tag: "Progress",
    tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    icon: <MdOutlineMonitorHeart className="text-xl text-teal-400" />,
    title: "Expected Progress & How to Track It",
    subtitle: "Set realistic expectations and know what to measure to stay on course.",
    chips: [
      { label: "Weekly cal balance", value: weeklyDeficit === 0 ? "±0 cal" : `${weeklyDeficit > 0 ? "+" : ""}${weeklyDeficit.toLocaleString()} cal`, color: weeklyDeficit < 0 ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : weeklyDeficit > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "Expected/week",      value: weeklyKg === 0 ? "Recomp" : `${weeklyKg > 0 ? "+" : ""}${weeklyKg.toFixed(2)} kg`,                        color: "bg-neutral-800 text-neutral-300 border-neutral-700" },
      { label: "Goal",               value: goal.charAt(0).toUpperCase() + goal.slice(1),                                                               color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
    ],
    tips: [
      "Weigh yourself every morning after using the bathroom, before eating. Use the weekly average.",
      "Don't panic over daily fluctuations of 0.5–1.5 kg — that's just water and food weight.",
      goal === "cut"  ? `Expect −${Math.abs(weeklyKg).toFixed(2)} kg/week. If losing faster than 1 kg/week, add 200 cal back.` : "",
      goal === "bulk" ? `Expect +${weeklyKg.toFixed(2)} kg/week. If gaining faster than 0.5 kg/week, reduce by 200 cal.` : "",
      "Take progress photos every 2 weeks — the scale doesn't show body composition changes.",
      "Measure waist, chest, hips, and arms monthly — these numbers tell the real story.",
      "Re-calculate your TDEE every 4–6 weeks as your weight changes.",
      "Plateau for >2 weeks? Drop calories by 100–150 or add one cardio session.",
    ].filter(Boolean) as string[],
  });

  return results;
}

// ─── TDEE Suggestions Component ─────────────────────────────────────────────────
function TDEESuggestionsSection({
  tdee, bmr, bmi, weight, age, gender, activityKey,
}: {
  tdee: number; bmr: number; bmi: number; weight: number;
  age: number; gender: string; activityKey: string;
}) {
  const [expanded, setExpanded] = useState<string | null>("goal");

  if (!tdee || !bmr) return (
    <div className="rounded-2xl border border-neutral-700/40 bg-[#0d0d0d] p-8 text-center">
      <IoNutrition className="text-4xl text-neutral-600 mx-auto mb-3" />
      <p className="text-neutral-400 text-sm font-medium mb-1">Enter your details to get suggestions</p>
      <p className="text-neutral-600 text-xs">Age, gender, weight, and height are needed to calculate your TDEE.</p>
    </div>
  );

  const suggestions = buildTDEESuggestions(tdee, bmr, bmi, weight, age, gender, activityKey);
  const goal        = getRecommendedGoal(bmi, activityKey, gender);

  const goalColors: Record<GoalType, string> = {
    cut:     "bg-rose-500/20 text-rose-300 border-rose-500/40",
    maintain:"bg-green-500/20 text-green-300 border-green-500/40",
    bulk:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    recomp:  "bg-sky-500/20 text-sky-300 border-sky-500/40",
  };

  return (
    <div className="space-y-3 fade-up">
      {/* Recommendation banner */}
      <div className={cn("rounded-2xl border px-5 py-4 flex items-center gap-4", goalColors[goal])}>
        <div className="text-3xl">
          {goal === "cut" ? "✂️" : goal === "bulk" ? "💪" : goal === "recomp" ? "🔄" : "⚖️"}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest opacity-70 mb-0.5">Recommended for you</p>
          <p className="font-bold text-white text-base capitalize">
            {goal === "cut" ? "Fat Loss — Calorie Deficit" : goal === "bulk" ? "Lean Bulk — Calorie Surplus" : goal === "recomp" ? "Body Recomposition" : "Maintain & Optimize"}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            Based on BMI {bmi > 0 ? bmi : "—"} · {ACTIVITY_LEVELS.find(a => a.key === activityKey)?.label} · TDEE {tdee.toLocaleString()} cal
          </p>
        </div>
      </div>

      {/* Suggestion accordion cards */}
      {suggestions.map((s) => {
        const isOpen = expanded === s.id;
        return (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : s.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide", s.tagColor)}>{s.tag}</span>
                </div>
                <p className="text-sm font-semibold text-white leading-snug">{s.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{s.subtitle}</p>
              </div>
              <span className={cn("text-neutral-500 text-lg transition-transform duration-300 shrink-0", isOpen && "rotate-180")}>⌄</span>
            </button>

            {isOpen && (
              <div className="border-t border-white/5 px-5 pb-5">
                <p className="text-xs text-neutral-500 mt-4 mb-3 leading-relaxed">{s.subtitle}</p>

                {s.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {s.chips.map(c => (
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
          {isTeen ? "Growing bodies need proper nutrition — consult a pediatrician for a healthy meal plan."
            : isSenior ? "For older adults, maintaining muscle mass is key — consider protein-rich foods and light resistance training."
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
    ? isSenior ? "For older adults, gradual weight reduction under medical supervision is safest."
      : gender === "female" ? "Women may carry weight differently — focus on sustainable habits over rapid loss."
      : "Reducing to a healthy BMI may significantly lower health risks."
    : isTeen ? "For teens, focus on healthy habits rather than strict dieting — consult a doctor."
    : "You're close to the healthy range — small consistent changes make a big difference.";

  const suggestions = [
    { icon: <GiMeal className="text-lg text-yellow-400 shrink-0 mt-0.5" />, title: "Balanced Diet",
      tips: isObese
        ? ["Reduce processed foods, sugar, and refined carbs.", "Fill half your plate with vegetables and fiber-rich foods.", "Choose lean proteins: chicken, fish, legumes, tofu.", "Control portions — try smaller plates and mindful eating."]
        : ["Reduce sugary drinks and high-calorie snacks.", "Swap refined carbs for whole grains.", "Increase vegetable and lean protein intake."] },
    { icon: <GiRunningShoe className="text-lg text-orange-400 shrink-0 mt-0.5" />, title: "Physical Activity",
      tips: isObese
        ? ["Start with 30 min of brisk walking daily.", "Gradually add low-impact cardio: swimming, cycling.", "Include 2–3 strength training sessions per week.", "Take the stairs, walk short distances instead of driving."]
        : ["Aim for 150 min of moderate cardio per week.", "Add 2 strength training sessions weekly.", "Stay active throughout the day."] },
    { icon: <GiWaterDrop className="text-lg text-cyan-400 shrink-0 mt-0.5" />, title: "Hydration",
      tips: ["Drink 8–10 glasses of water daily.", "Replace sodas with water or herbal teas.", "Drink a glass before meals to reduce appetite."] },
    { icon: <GiNightSleep className="text-lg text-violet-400 shrink-0 mt-0.5" />, title: "Sleep & Stress",
      tips: ["Aim for 7–9 hours of quality sleep each night.", "Poor sleep increases hunger hormones.", "Practice stress management: meditation, deep breathing."] },
    ...(isObese ? [{ icon: <FaUserDoctor className="text-lg text-red-400 shrink-0 mt-0.5" />, title: "Medical Consultation",
      tips: ["Consult a doctor or dietitian for a personalized plan.", "Rule out underlying conditions (thyroid, PCOS).", "Consider medically supervised programs if BMI > 35."] }] : []),
  ];

  return (
    <div className="mt-5 slide-in">
      <div className={cn("flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl border",
        isObese ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300")}>
        {isObese ? <MdError className="text-lg shrink-0 mt-0.5 text-red-400" /> : <MdWarning className="text-lg shrink-0 mt-0.5 text-yellow-400" />}
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
    { formula: "G.J. Hamwi Formula (1964)",    kg: ideal.hamwi },
    { formula: "B.J. Devine Formula (1974)",   kg: ideal.devine },
    { formula: "J.D. Robinson Formula (1983)", kg: ideal.robinson },
    { formula: "D.R. Miller Formula (1983)",   kg: ideal.miller },
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
            {inRange ? "✓ In Range" : `${weight < low ? weight - low : weight - high > 0 ? "+" : ""}${(weight - (weight < low ? low : high)).toFixed(1)} kg`}
          </div>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        {values.map((v, i) => (
          <div key={v.formula}
            className={cn("flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0",
              "bg-neutral-900 hover:bg-neutral-800 transition-all",
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
          { label: "5% Body Fat",   val: mp.at5,  desc: "Contest shape",      color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10"    },
          { label: "10% Body Fat",  val: mp.at10, desc: "Athletic / lean",    color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
          { label: "15% Body Fat",  val: mp.at15, desc: "Healthy & muscular", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
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

  const activeCal  = cals[tab];
  const macros     = calcMacros(activeCal);
  const activeTab  = tabs.find(t => t.key === tab)!;

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
                { icon: <TbMeat className="text-sm text-red-400" />,      label: "Protein", g: m.protein, color: "bg-red-500"    },
                { icon: <TbDroplet className="text-sm text-yellow-400" />, label: "Fats",    g: m.fat,     color: "bg-yellow-500" },
                { icon: <TbSalad className="text-sm text-green-400" />,   label: "Carbs",   g: m.carbs,   color: "bg-green-500"  },
              ].map(n => {
                const maxG = Math.max(m.protein, m.fat, m.carbs);
                return (
                  <div key={n.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 text-xs text-neutral-400">{n.icon}{n.label}</span>
                      <span className="text-xs font-bold text-white">{n.g}g</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", n.color, "opacity-70")}
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
  const [age, setAge]           = useState<number>(0);
  const [gender, setGender]     = useState<string>("");
  const [activityKey, setActivityKey] = useState("sedentary");

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadReport = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("diet-plan-report");
      if (!element) return;

      // The new library creates the image data directly!
      const dataURL = await htmlToImage.toPng(element, {
        pixelRatio: 2, // High resolution (similar to scale: 2)
        backgroundColor: '#111111', 
      });

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `AUTOMA-FIT_Plan_${new Date().toISOString().slice(0,10)}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to download report:", err);
      
      // TypeScript-safe error checking
      if (err instanceof Error) {
        alert("Error: " + err.message);
      } else {
        alert("An unknown error occurred while saving.");
      }
      
    } finally {
      setIsDownloading(false);
    }
  };

  // Firebase listener
  useEffect(() => {
    const energyRef   = ref(database, "monitoring");
    const unsubscribe = onValue(energyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setHealthCheck({
        spo2:        Number(data.spo2)        || 0,
        heartrate:   Number(data.heartrate)   || 0,
        temperature: Number(data.temperature) || 0,
        weight:      Number(data.weight)      || 0,
        height:      Number(data.height)      || 0,
      });
    });
    return () => unsubscribe();
  }, []);

  // Computed values
  const bmi = healthCheck.weight > 0 && healthCheck.height > 0
    ? parseFloat((healthCheck.weight / Math.pow(healthCheck.height / 100, 2)).toFixed(1))
    : 0;
  const bmiInfo = getBMICategory(bmi);

  const bmr      = calcBMR(healthCheck.weight, healthCheck.height, age, gender);
  const activity = ACTIVITY_LEVELS.find(a => a.key === activityKey)!;
  const tdee     = calcTDEE(bmr, activity.multiplier);

  // Derive recommended goal for DietSection
  const recommendedGoal = getRecommendedGoal(bmi, activityKey, gender);

  const bmiSegments = [
    { label: "Underweight", range: "<18.5",    color: "bg-blue-500"   },
    { label: "Normal",      range: "18.5–24.9", color: "bg-green-500"  },
    { label: "Overweight",  range: "25–29.9",  color: "bg-yellow-500" },
    { label: "Obese",       range: "≥30",      color: "bg-red-500"    },
  ];

  const bmiNeedle = bmi === 0 ? null
    : bmi < 18.5  ? Math.min((bmi / 18.5) * 25, 25)
    : bmi < 25    ? 25 + ((bmi - 18.5) / 6.5) * 25
    : bmi < 30    ? 50 + ((bmi - 25) / 5) * 25
    : Math.min(75 + ((bmi - 30) / 10) * 25, 100);

  const BMIStatusIcon = () => {
    if (bmi === 0)   return <MdAssignment className="text-2xl text-neutral-400 icon-float" />;
    if (bmi < 18.5)  return <MdTrendingDown className="text-2xl text-blue-400 icon-float" />;
    if (bmi < 25)    return <MdCheckCircle className="text-2xl text-green-400 icon-spin-pulse" />;
    if (bmi < 30)    return <MdWarning className="text-2xl text-yellow-400 icon-bmi-ping" />;
    return <MdError className="text-2xl text-red-400 icon-heartbeat" />;
  };

  const healthCards = [
    { label: "SpO₂",        value: healthCheck.spo2 > 0        ? healthCheck.spo2.toFixed(0)        : "—", unit: "%",   icon: <FaLungs         className="text-2xl text-cyan-400 icon-breathe"   />, status: getSpo2Status(healthCheck.spo2),          color: "from-cyan-500/20 to-cyan-600/5",    border: "border-cyan-500/30",    accent: "text-cyan-400"    },
    { label: "Heart Rate",  value: healthCheck.heartrate > 0   ? healthCheck.heartrate.toFixed(0)   : "—", unit: "bpm", icon: <FaHeartbeat     className="text-2xl text-red-400 icon-heartbeat"  />, status: getHeartRateStatus(healthCheck.heartrate), color: "from-red-500/20 to-red-600/5",      border: "border-red-500/30",     accent: "text-red-400"     },
    { label: "Temperature", value: healthCheck.temperature > 0 ? healthCheck.temperature.toFixed(1) : "—", unit: "°C",  icon: <WiThermometer   className="text-3xl text-orange-400 icon-thermo"  />, status: getTempStatus(healthCheck.temperature),    color: "from-orange-500/20 to-orange-600/5", border: "border-orange-500/30",  accent: "text-orange-400"  },
    { label: "Weight",      value: healthCheck.weight > 0      ? healthCheck.weight.toFixed(1)      : "—", unit: "kg",  icon: <FaWeight        className="text-2xl text-violet-400 icon-float"    />, status: healthCheck.weight > 0 ? "Measured" : "—", color: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/30",  accent: "text-violet-400"  },
    { label: "Height",      value: healthCheck.height > 0      ? healthCheck.height.toFixed(0)      : "—", unit: "cm",  icon: <FaRulerVertical className="text-2xl text-pink-400 icon-ruler"     />, status: healthCheck.height > 0 ? "Measured" : "—", color: "from-pink-500/20 to-pink-600/5",    border: "border-pink-500/30",    accent: "text-pink-400"    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden px-4 py-12">
      <style>{iconAnimationStyles}</style>

      {/* Grid BG */}
      <div className={cn("absolute inset-0 [background-size:40px_40px]",
        "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
        "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]")} />
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
                  <input type="number" min={1} max={120} value={age === 0 ? "" : age}
                    onChange={(e) => { const v = parseInt(e.target.value); setAge(isNaN(v) ? 0 : Math.min(120, Math.max(1, v))); }}
                    placeholder="e.g. 25"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-all" />
                  {age > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">yrs</span>}
                </div>
                {age > 0 && age < 18 && <p className="text-amber-500 text-xs mt-1 flex items-center gap-1"><MdWarning /> Teen — BMI may vary</p>}
                {age >= 65             && <p className="text-violet-400 text-xs mt-1 flex items-center gap-1"><MdCheckCircle /> Senior — tailored advice</p>}
              </div>
            </div>

            {/* BMI bar */}
            <div className="mb-2">
              <div className="flex rounded-full overflow-hidden h-3 w-full mb-2 gap-0.5">
                {bmiSegments.map((seg) => (
                  <div key={seg.label} className={cn("flex-1 rounded-full", seg.color, "opacity-60")} />
                ))}
              </div>
              {bmiNeedle !== null && (
                <div className="relative h-3 w-full -mt-5">
                  <div className="absolute top-0 w-1 h-5 rounded-full bg-white shadow-lg shadow-white/40 -translate-x-1/2 transition-all duration-700"
                    style={{ left: `${bmiNeedle}%` }} />
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

            {tdee > 0 && (
              <button
                onClick={downloadReport}
                disabled={isDownloading}
                className="mt-5 mb-2 w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                <MdCheckCircle className={cn("text-xl text-green-400", isDownloading && "animate-pulse")} />
                {isDownloading ? "Generating Image File..." : "Save Diet Plan & BMI to Phone"}
              </button>
            )}

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

       {/* ── Diet Recommendations & Screenshot Target ── */}
        {tdee > 0 && (
          <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
            <SectionHeader
              icon={<MdRestaurantMenu className="text-xl text-green-400" />}
              title="Recommended Meals"
            />
            
            {/* EVERYTHING INSIDE THIS DIV WILL BE SAVED AS THE IMAGE */}
            <div id="diet-plan-report" className="bg-[#111111] rounded-2xl pb-2">
              
              {/* Official Report Header (Only visible when downloading or viewing diet plan) */}
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4 mt-2">
                <div>
                  <h2 className="text-white font-bold text-lg tracking-wide">AUTOMA-FIT Diet Plan</h2>
                  <p className="text-xs text-neutral-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Your BMI</p>
                  <p className={cn("text-xl font-bold leading-none", bmiInfo.accent)}>
                    {bmi > 0 ? bmi : "—"} <span className="text-sm font-normal">({bmiInfo.label})</span>
                  </p>
                </div>
              </div>

              <DietSection
                goal={recommendedGoal}
                tdee={tdee}
                weight={healthCheck.weight}
                activityKey={activityKey}
              />
            </div>
            {/* END OF SCREENSHOT TARGET */}

            {/* The Download Button */}
            <button
              onClick={downloadReport}
              disabled={isDownloading}
              className="mt-6 w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/20"
            >
              <MdCheckCircle className={cn("text-2xl", isDownloading && "animate-pulse")} />
              {isDownloading ? "Generating Image File..." : "Save Diet Plan & BMI to Phone"}
            </button>
          </div>
        )}

        {/* ── Exercise Plan (EXERCISE_DATA matched) ── */}
        {tdee > 0 && (
          <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
            <SectionHeader
              icon={<MdFitnessCenter className="text-xl text-violet-400" />}
              title="Recommended Exercise Plan"
            />
            <ExerciseSection
              goal={recommendedGoal}
              tdee={tdee}
              activityKey={activityKey}
              bmi={bmi}
            />
          </div>
        )}

        {/* ── Dynamic Suggestions ── */}
        <div className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl shadow-black/60">
          <SectionHeader
            icon={<LuBrain className="text-xl text-violet-400 icon-float" />}
            title="TDEE-Based Suggestions"
          />
          <TDEESuggestionsSection
            tdee={tdee}
            bmr={bmr}
            bmi={bmi}
            weight={healthCheck.weight}
            age={age}
            gender={gender}
            activityKey={activityKey}
          />
        </div>

      </div>
    </div>
  );
}