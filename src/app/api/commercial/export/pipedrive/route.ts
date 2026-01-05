import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { CommercialLead } from "@/models/commercial/lead/model";
import { PipedriveService } from "@/services/commercial/pipedrive";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const { leadIds } = await req.json();
    if (!leadIds || !Array.isArray(leadIds)) {
        return NextResponse.json({ error: "Invalid leadIds" }, { status: 400 });
    }

    const leads = await CommercialLead.find({ _id: { $in: leadIds } });
    const results = [];

    for (const lead of leads) {
        try {
            // 1. Check if exists
            // Assuming phone or email is the key. If both missing, skip or use name?
            const term = lead.email || lead.phone || lead.name;
            const existing = await PipedriveService.searchPerson(term);

            if (existing) {
                results.push({ id: lead._id, status: "duplicate", pipedriveId: existing.id });
                continue;
            }

            // 2. Create Person
            const person = await PipedriveService.createPerson({
                name: lead.name,
                email: lead.email || undefined,
                phone: lead.phone || undefined
            });

            if (person && person.id) {
                // 3. Create Deal
                const deal = await PipedriveService.createDeal(person.id, `Negócio: ${lead.name}`);
                
                // 4. Create Activity
                if (deal && deal.id) {
                    await PipedriveService.createActivity(deal.id, "Enviar Primeiro Toque");
                }
                
                results.push({ id: lead._id, status: "success", pipedriveId: person.id });
            } else {
                results.push({ id: lead._id, status: "failed", error: "Could not create person" });
            }

        } catch (err: any) {
            console.error(`Export Error for lead ${lead._id}:`, err);
            results.push({ id: lead._id, status: "error", error: err.message });
        }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error("Export Pipedrive Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
