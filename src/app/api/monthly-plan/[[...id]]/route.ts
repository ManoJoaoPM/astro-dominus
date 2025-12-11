// src/app/api/astro/monthly-plans/[[...id]]/route.ts
import {
  MonthlyPlan,
  MonthlyPlanInterface,
  monthlyPlanFormSchema,
  monthlyPlanUpdateSchema,
} from "@/models/socialmedia/monthly-plan/model";
import { CRUDController } from "@/struct";

function sanitizeMonthlyPlan(plan: MonthlyPlanInterface) {
  return {
    _id: plan._id,
    clientId: plan.clientId,
    month: plan.month,
    year: plan.year,
    items: plan.items,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  } as any;
}

export const { GET, POST, DELETE, PATCH, dynamic, runtime } = new CRUDController(
  MonthlyPlan,
  {
    createSchema: monthlyPlanFormSchema,
    updateSchema: monthlyPlanUpdateSchema,
    softDelete: true,
    hooks: {
      beforeSend: async (data) => {
        if (Array.isArray(data)) return data.map(sanitizeMonthlyPlan);
        if (!data) return data;
        return sanitizeMonthlyPlan(data as MonthlyPlanInterface);
      },
    },
    roles: {
      GET: ["admin", "operational"],
      POST: ["admin", "operational"],
      PATCH: ["admin", "operational"],
      DELETE: ["admin"],
    },
  }
);
