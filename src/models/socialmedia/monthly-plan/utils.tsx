// src/models/astro/monthly-plan/utils.tsx
"use client";

import { MonthlyPlanInterface } from "@/models/socialmedia/monthly-plan";

export * from "@/models/socialmedia/monthly-plan";

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getMonthLabel(plan: MonthlyPlanInterface) {
  return `${MONTH_NAMES[plan.month - 1]} / ${plan.year}`;
}
