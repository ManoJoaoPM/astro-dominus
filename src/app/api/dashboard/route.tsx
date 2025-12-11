import { startOfMonth, subMonths } from "date-fns";
import { withSession } from "@/struct";
import { User } from "@/models/identity/user/model";
import { CommercialLead } from "@/models/commercial/lead/model";

export const GET = withSession(async () => {
  const now = new Date();
  const startCurrentMonth = startOfMonth(now);
  const startPreviousMonth = startOfMonth(subMonths(now, 1));

  const userQuery = { deletedAt: null, role: "user" };
  const totalUsers = await User.countDocuments(userQuery);
  const activeUsers = await User.countDocuments({ ...userQuery, status: "active" });
  const newUsersThisMonth = await User.countDocuments({ ...userQuery, createdAt: { $gte: startCurrentMonth } });
  const newUsersLastMonth = await User.countDocuments({
    ...userQuery,
    createdAt: { $gte: startPreviousMonth, $lt: startCurrentMonth },
  });

  const usersGrowth =
    newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 100;

  const leadQuery = { deletedAt: null };
  const totalLeads = await CommercialLead.countDocuments(leadQuery);

  // --- Receita ---

  return Response.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      growth: usersGrowth.toFixed(1),
    },
    leads: {
      total: totalLeads,
    },
  });
});
