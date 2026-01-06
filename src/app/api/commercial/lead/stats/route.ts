import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/struct";
import { CommercialLead } from "@/models/commercial/lead/model";
import { startConnection } from "@/lib/mongoose";

export const GET = withSession(async ({ user }, req: NextRequest) => {
  await startConnection();

  const [total, qualified, pending, unqualified] = await Promise.all([
    CommercialLead.countDocuments({}),
    CommercialLead.countDocuments({ qualificationStatus: "qualified" }),
    CommercialLead.countDocuments({ qualificationStatus: "pending" }),
    CommercialLead.countDocuments({ qualificationStatus: "unqualified" }),
  ]);

  return NextResponse.json({
    total,
    qualified,
    pending,
    unqualified,
  });
});
