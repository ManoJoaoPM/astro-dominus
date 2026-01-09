import { NextRequest, NextResponse } from "next/server";
import { startConnection } from "@/lib/mongoose";
import { CommercialLead } from "@/models/commercial/lead/model";
import { PipedriveService } from "@/services/commercial/pipedrive";

// Forcing dynamic to ensure we always fetch fresh data if needed, though this is an action
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    await startConnection();
    try {
        console.log("[Sync] Starting Pipedrive Organization Sync...");
        
        // 1. Fetch all organizations from Pipedrive
        // Pagination handling: fetch until no more items
        let allOrgs: any[] = [];
        let start = 0;
        const limit = 500;
        let keepFetching = true;

        while (keepFetching) {
            const orgs = await PipedriveService.getAllOrganizations(start, limit);
            if (orgs && orgs.length > 0) {
                allOrgs = [...allOrgs, ...orgs];
                start += limit;
                // If we got less than limit, we reached the end
                if (orgs.length < limit) keepFetching = false;
            } else {
                keepFetching = false;
            }
        }

        console.log(`[Sync] Fetched ${allOrgs.length} organizations from Pipedrive.`);

        let updatedCount = 0;
        let createdCount = 0;

        // 2. Sync with local database
        for (const org of allOrgs) {
            const pipedriveId = org.id;
            const name = org.name;
            const address = org.address; // Pipedrive standard address

            // Extract Custom Fields
            const phone = org["9e0029deb374524025c9caeed9ab91c24cc20948"] || null;
            const email = org["d9fe8d1de74611de9733e9407c9ccfc09f0bdd26"] || null;
            const instagram = org["05db8ad96887e6e633e689a7bf3d8d303549e97d"] || null;
            const website = org["959dff9e8e70ad6be476609d021356c00dcaa801"] || null;
            // Rating/Reviews might be difficult to sync back if format differs, skipping for now to avoid overwriting good data with bad
            
            // Try to find existing lead by Pipedrive ID first
            let lead = await CommercialLead.findOne({ pipedriveId });

            if (lead) {
                // Update basic info if missing
                let needsUpdate = false;
                if (!lead.address && address) { lead.address = address; needsUpdate = true; }
                if (!lead.phone && phone) { lead.phone = phone; needsUpdate = true; }
                if (!lead.email && email) { lead.email = email; needsUpdate = true; }
                if (!lead.instagram && instagram) { lead.instagram = instagram; needsUpdate = true; }
                if (!lead.website && website) { lead.website = website; needsUpdate = true; }
                
                // If user wants to ensure data is synced (e.g. name update), we could do it here
                // But generally we trust local data unless it's empty
                
                if (needsUpdate) await lead.save();
                updatedCount++;
            } else {
                // Try to find by Name (fuzzy match or exact?)
                // Using exact name for safety as requested "garantia que é a mesma empresa"
                // Or maybe name + city if available in address?
                // For now, let's stick to Name as the primary anchor
                lead = await CommercialLead.findOne({ name: name });

                if (lead) {
                    // Link existing lead to Pipedrive
                    lead.pipedriveId = pipedriveId;
                    lead.exportedAt = new Date(); // It exists there, so consider it exported
                    
                    if (!lead.address && address) lead.address = address;
                    if (!lead.phone && phone) lead.phone = phone;
                    if (!lead.email && email) lead.email = email;
                    if (!lead.instagram && instagram) lead.instagram = instagram;
                    if (!lead.website && website) lead.website = website;
                    
                    await lead.save();
                    updatedCount++;
                } else {
                    // Create new "Skeleton" lead from Pipedrive
                    await CommercialLead.create({
                        name: name,
                        address: address,
                        phone: phone,
                        email: email,
                        instagram: instagram,
                        website: website,
                        source: "manual", // or "pipedrive_import"
                        qualificationStatus: "qualified", // Assume if it's in Pipedrive, it's somewhat relevant? Or pending?
                        pipedriveId: pipedriveId,
                        exportedAt: new Date(),
                    });
                    createdCount++;
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            totalPipedrive: allOrgs.length,
            updated: updatedCount,
            created: createdCount
        });

    } catch (error: any) {
        console.error("Sync Pipedrive Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}