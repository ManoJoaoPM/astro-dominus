import { NextRequest, NextResponse } from "next/server";
import { startConnection } from "@/lib/mongoose";
import { CommercialLead } from "@/models/commercial/lead/model";
import { PipedriveService } from "@/services/commercial/pipedrive";

export async function POST(req: NextRequest) {
  await startConnection();
  try {
    const { leadIds, config } = await req.json(); // config: { batchSize, createDeal, createActivity, activitySubject }

    if (!leadIds || !Array.isArray(leadIds)) {
        return NextResponse.json({ error: "Invalid leadIds" }, { status: 400 });
    }

    const leads = await CommercialLead.find({ _id: { $in: leadIds } });
    const results = [];

    // Helper to calculate due date excluding weekends
    const addBusinessDays = (date: Date, days: number) => {
        const result = new Date(date);
        let added = 0;
        while (added < days) {
            result.setDate(result.getDate() + 1);
            if (result.getDay() !== 0 && result.getDay() !== 6) {
                added++;
            }
        }
        // Ensure result is not weekend (if days=0)
        while(result.getDay() === 0 || result.getDay() === 6) {
             result.setDate(result.getDate() + 1);
        }
        return result;
    };

    let processedCount = 0;
    const batchSize = config?.batchSize || 12;
    const createDeal = config?.createDeal !== false; // Default true
    const createActivity = config?.createActivity !== false; // Default true

    for (const lead of leads) {
        try {
            // Calculate Drip Delay
            // 0-11: D+0, 12-23: D+1, 24-35: D+2 ... (skipping weekends)
            const batchIndex = Math.floor(processedCount / batchSize);
            const today = new Date();
            const dueDate = addBusinessDays(today, batchIndex);
            const dueDateStr = dueDate.toISOString().split("T")[0];

            // 1. Check if Organization exists
            const term = lead.name;
            let existingOrg = null;
            if (term && term.length >= 2) {
                 existingOrg = await PipedriveService.searchOrganization(term);
            }

            // 2. Prepare Data (Custom Fields) - FIX: Only send if truthy
            const orgCustomFields: any = {};
            if (lead.phone) orgCustomFields["9e0029deb374524025c9caeed9ab91c24cc20948"] = lead.phone;
            if (lead.email) orgCustomFields["d9fe8d1de74611de9733e9407c9ccfc09f0bdd26"] = lead.email;
            if (lead.instagram) orgCustomFields["05db8ad96887e6e633e689a7bf3d8d303549e97d"] = lead.instagram;
            if (lead.website) orgCustomFields["959dff9e8e70ad6be476609d021356c00dcaa801"] = lead.website;
            if (lead.rating) orgCustomFields["74e96105566f22e70b0c8985542709b7a82ada1e"] = lead.rating.toString();
            
            if (lead.source === "scraper") {
                 orgCustomFields["5f75545702b937f7ecf21bbf35b7419637cb4aba"] = "Google Maps"; 
            }

            // If website missing in lead but we have lat/lng, generate maps link
            if (!orgCustomFields["959dff9e8e70ad6be476609d021356c00dcaa801"] && lead.lat && lead.lng) {
                orgCustomFields["959dff9e8e70ad6be476609d021356c00dcaa801"] = `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;
            }

            let finalOrgId = null;

            if (existingOrg) {
                // Update Organization
                // Only send fields if they exist to avoid overwriting with null
                const updatePayload: any = { custom_fields: orgCustomFields };
                if (lead.address || lead.city) updatePayload.address = lead.address || lead.city;
                if (lead.website) updatePayload.website = lead.website;

                await PipedriveService.updateOrganization(existingOrg.id, updatePayload);

                finalOrgId = existingOrg.id;
                results.push({ id: lead._id, status: "duplicate", pipedriveId: existingOrg.id });
            } else {
                // Create Organization
                const org = await PipedriveService.createOrganization({
                    name: lead.name,
                    address: lead.address || lead.city || undefined,
                    website: lead.website || undefined,
                    custom_fields: orgCustomFields
                });
                
                if (org && org.id) {
                   finalOrgId = org.id;
                   results.push({ id: lead._id, status: "success", pipedriveId: org.id });
                } else {
                   results.push({ id: lead._id, status: "failed", error: "Could not create organization" });
                   continue; // Skip rest if org failed
                }
            }

            // Link local lead
            if (finalOrgId) {
                await CommercialLead.updateOne({ _id: lead._id }, { 
                    pipedriveId: finalOrgId, 
                    exportedAt: new Date() 
                });

                // Create Person, Deal, Activity
                
                // 3. Create Person (Optional)
                const personName = `Contato - ${lead.name}`;
                let personId = undefined;
                try {
                   // Only create person if we have some contact info? Or always?
                   // User didn't specify, but good practice.
                   const person = await PipedriveService.createPerson({
                      name: personName,
                      email: lead.email || undefined,
                      phone: lead.phone || undefined,
                      org_id: finalOrgId
                   });
                   if (person) personId = person.id;
                } catch (e) {
                   console.error("Failed to create person linked to org, continuing...", e);
                }

                if (createDeal) {
                    // 4. Create Deal
                    const dealCustomFields: any = {};
                    if (lead.rating) {
                        dealCustomFields["2c4dd0ea375e3c4af42948c3bff5057e16420779"] = lead.rating.toString();
                    }

                    const deal = await PipedriveService.createDeal(
                        `Negócio: ${lead.name}`, 
                        personId, 
                        finalOrgId,
                        dealCustomFields
                    );
                    
                    if (deal && deal.id && createActivity) {
                        // 5. Create Activity with Drip Date
                        const subject = config?.activitySubject || "Enviar Primeiro Toque";
                        
                        // We need to support due_date in createActivity service
                        // Currently it uses new Date().toISOString() hardcoded.
                        // We need to update PipedriveService.createActivity to accept date.
                        // I will update the service call here assuming I'll fix the service next.
                        await PipedriveService.createActivity(deal.id, subject, dueDateStr);
                    }
                }
            }
            
            processedCount++;

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
