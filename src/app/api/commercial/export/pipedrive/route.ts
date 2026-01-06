import { NextRequest, NextResponse } from "next/server";
import { startConnection } from "@/lib/mongoose";
import { CommercialLead } from "@/models/commercial/lead/model";
import { PipedriveService } from "@/services/commercial/pipedrive";

export async function POST(req: NextRequest) {
  await startConnection();
  try {
    const { leadIds } = await req.json();
    if (!leadIds || !Array.isArray(leadIds)) {
        return NextResponse.json({ error: "Invalid leadIds" }, { status: 400 });
    }

    const leads = await CommercialLead.find({ _id: { $in: leadIds } });
    const results = [];

    for (const lead of leads) {
        try {
            // 1. Check if Organization exists
            const term = lead.name;
            let existingOrg = null;
            if (term && term.length >= 2) {
                 existingOrg = await PipedriveService.searchOrganization(term);
            }

            // 2. Prepare Data (Custom Fields)
            const orgCustomFields: any = {
                "9e0029deb374524025c9caeed9ab91c24cc20948": lead.phone || "",
                "d9fe8d1de74611de9733e9407c9ccfc09f0bdd26": lead.email || "",
                "05db8ad96887e6e633e689a7bf3d8d303549e97d": lead.instagram || "",
                "959dff9e8e70ad6be476609d021356c00dcaa801": lead.website || "", 
                "74e96105566f22e70b0c8985542709b7a82ada1e": lead.rating ? lead.rating.toString() : "",
            };

            if (lead.source === "scraper") {
                 orgCustomFields["5f75545702b937f7ecf21bbf35b7419637cb4aba"] = "Google Maps"; 
            }

            if (!orgCustomFields["959dff9e8e70ad6be476609d021356c00dcaa801"] && lead.lat && lead.lng) {
                orgCustomFields["959dff9e8e70ad6be476609d021356c00dcaa801"] = `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;
            }

            if (existingOrg) {
                // Update Organization
                await PipedriveService.updateOrganization(existingOrg.id, {
                    address: lead.address || lead.city || undefined,
                    website: lead.website || undefined,
                    custom_fields: orgCustomFields
                });

                // Update local lead to mark as exported/linked
                await CommercialLead.updateOne({ _id: lead._id }, { 
                    pipedriveId: existingOrg.id, 
                    exportedAt: new Date() 
                });

                results.push({ id: lead._id, status: "duplicate", pipedriveId: existingOrg.id });
                continue;
            }

            // 3. Create Organization
            const org = await PipedriveService.createOrganization({
                name: lead.name,
                address: lead.address || lead.city || undefined,
                website: lead.website || undefined,
                custom_fields: orgCustomFields
            });

            if (org && org.id) {
                // 3. Create Person (Optional, but good practice to link contact info)
                // Use "Contato" as default name if only organization name is known, or reuse lead name with suffix
                const personName = `Contato - ${lead.name}`;
                
                let personId = undefined;
                try {
                   const person = await PipedriveService.createPerson({
                      name: personName,
                      email: lead.email || undefined,
                      phone: lead.phone || undefined,
                      org_id: org.id
                   });
                   if (person) personId = person.id;
                } catch (e) {
                   console.error("Failed to create person linked to org, continuing...", e);
                }

                // 4. Create Deal linked to Organization (and Person if available)
                // Deal Custom Field: Avaliação do Negócio (2c4dd0ea375e3c4af42948c3bff5057e16420779)
                // O que mandar aqui? Rating de novo? Ou é um texto de avaliação nossa?
                // Assumindo que seja o rating ou reviews. Vou mandar o rating formatado.
                const dealCustomFields: any = {};
                if (lead.rating) {
                    dealCustomFields["2c4dd0ea375e3c4af42948c3bff5057e16420779"] = lead.rating.toString();
                }

                const deal = await PipedriveService.createDeal(
                    `Negócio: ${lead.name}`, 
                    personId, 
                    org.id,
                    dealCustomFields
                );
                
                // 5. Create Activity
                if (deal && deal.id) {
                    await PipedriveService.createActivity(deal.id, "Enviar Primeiro Toque");
                }
                
                // Update local lead
                await CommercialLead.updateOne({ _id: lead._id }, { 
                    pipedriveId: org.id, 
                    exportedAt: new Date() 
                });
                
                results.push({ id: lead._id, status: "success", pipedriveId: org.id });
            } else {
                results.push({ id: lead._id, status: "failed", error: "Could not create organization" });
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
