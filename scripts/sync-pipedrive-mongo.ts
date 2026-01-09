import 'dotenv/config'; // Must be first to load env vars

// Ensure env vars are present before importing app code which might validate them
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env');
  process.exit(1);
}

import axios from 'axios';
import { startConnection } from '@/lib/mongoose';
import { CommercialLead } from '@/models/commercial/lead/model';

// --- Configuration ---
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_COMPANY_DOMAIN = process.env.PIPEDRIVE_COMPANY_DOMAIN?.replace(/^https?:\/\//, "").replace(/\.pipedrive\.com.*$/, "");

// --- FIXED FIELD IDs (Same as fix script) ---
const FIELD_IDS = {
    phone: '9e0029deb374524025c9caeed9ab91c24cc20948',
    email: 'd9fe8d1de74611de9733e9407c9ccfc09f0bdd26',
    maps_url: '959dff9e8e70ad6be476609d021356c00dcaa801',
    maps_rating: '74e96105566f22e70b0c8985542709b7a82ada1e',
    instagram: '05db8ad96887e6e633e689a7bf3d8d303549e97d',
    source: '5f75545702b937f7ecf21bbf35b7419637cb4aba',
    website: 'website' 
};

if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_COMPANY_DOMAIN) {
  console.error('❌ PIPEDRIVE_API_TOKEN e PIPEDRIVE_COMPANY_DOMAIN são obrigatórios.');
  process.exit(1);
}

const pipedriveClient = axios.create({
  baseURL: `https://${PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/api/v1`,
  params: { api_token: PIPEDRIVE_API_TOKEN },
});

// --- Helpers ---

// We switched to syncing ORGANIZATIONS, not PERSONS, based on previous context
async function getAllPipedriveOrganizations() {
  let allOrgs: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  console.log('🔄 Buscando todas as ORGANIZAÇÕES no Pipedrive...');

  while (hasMore) {
    try {
      const res = await pipedriveClient.get('/organizations', {
        params: { start, limit }
      });
      
      const items = res.data.data || [];
      allOrgs = [...allOrgs, ...items];
      
      console.log(`   - Buscados ${items.length} (Total: ${allOrgs.length})`);

      if (!res.data.additional_data?.pagination?.more_items_in_collection) {
        hasMore = false;
      } else {
        start += limit;
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar organizações no Pipedrive:', error.message);
      hasMore = false;
    }
  }
  return allOrgs;
}

// --- Main Script ---

async function main() {
  console.log('🚀 Iniciando sincronização Pipedrive (Organizações) -> MongoDB...');

  // 1. Connect to MongoDB
  await startConnection();

  // 2. Fetch Pipedrive Data
  const orgs = await getAllPipedriveOrganizations();
  console.log(`✅ ${orgs.length} organizações recuperadas.`);

  // 3. Upsert into MongoDB
  let upsertedCount = 0;
  let errorCount = 0;

  for (const org of orgs) {
    try {
      // Map Pipedrive Organization to CommercialLead
      
      // Use Custom Field IDs if available, else fallback to null
      const phone = org[FIELD_IDS.phone] || null;
      const email = org[FIELD_IDS.email] || null;
      const instagram = org[FIELD_IDS.instagram] || null;
      const website = org[FIELD_IDS.website] || null;
      
      const mapsUrl = org[FIELD_IDS.maps_url] || null; // Where to map this? CommercialLead has no specific mapUrl field in schema usually, check model.
      // CommercialLead schema has: website, instagram. Doesn't seem to have mapsUrl explicitly in interface unless we add it or put in notes?
      // Let's stick to known fields.

      const address = org.address || org.address_formatted_address || null;

      const updateData = {
        name: org.name,
        pipedriveId: org.id,
        phone: phone,
        email: email,
        website: website,
        instagram: instagram,
        address: address,
        // Map other fields if schema supports them
        
        $setOnInsert: { 
            source: 'manual', // or 'pipedrive_import'
            qualificationStatus: 'pending',
            createdAt: new Date()
        },
        updatedAt: new Date()
      };

      // Filter by pipedriveId
      let filter: any = { pipedriveId: org.id };
      
      // IMPORTANT: We do NOT filter by name for updates to avoid merging unrelated entities if IDs differ.
      // We rely on pipedriveId as the source of truth for synchronization.
      
      await CommercialLead.findOneAndUpdate(
        filter,
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      upsertedCount++;
      if (upsertedCount % 50 === 0) process.stdout.write('.');

    } catch (err: any) {
      errorCount++;
      console.error(`\n❌ Erro ao salvar ${org.name}:`, err.message);
    }
  }

  console.log('\n\n📊 Relatório Final:');
  console.log(`✅ Sincronizados/Atualizados no MongoDB: ${upsertedCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
