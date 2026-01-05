import { NextResponse } from "next/server";
import { CommercialLead } from "@/models/commercial/lead/model";

// GET /api/commercial/lead/map?status=pending|qualified|unqualified&city=...&state=...&q=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const q = searchParams.get("q");

  const query: any = {
    // só os que têm coordenadas para o mapa
    lat: { $ne: null },
    lng: { $ne: null },
  };

  if (status && ["pending", "qualified", "unqualified"].includes(status)) {
    query.qualificationStatus = status;
  }

  if (city) query.city = city;
  if (state) query.state = state;

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
      { instagram: { $regex: q, $options: "i" } },
      { website: { $regex: q, $options: "i" } },
    ];
  }

  const leads = await CommercialLead.find(query)
    .select("_id name city state address instagram website qualificationStatus lat lng createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    ok: true,
    count: leads.length,
    leads,
  });
}
