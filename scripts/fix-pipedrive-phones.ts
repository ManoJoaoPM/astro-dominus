import 'dotenv/config';
import { Pool } from 'pg';
import axios from 'axios';
import readline from 'readline';

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_TABLE = 'leads';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_COMPANY_DOMAIN = process.env.PIPEDRIVE_COMPANY_DOMAIN?.replace(/^https?:\/\//, "").replace(/\.pipedrive\.com.*$/, "");

// --- FIXED FIELD IDs (Provided by User) ---
const FIELD_IDS = {
    phone: '9e0029deb374524025c9caeed9ab91c24cc20948',
    email: 'd9fe8d1de74611de9733e9407c9ccfc09f0bdd26',
    maps_url: '959dff9e8e70ad6be476609d021356c00dcaa801',
    maps_rating: '74e96105566f22e70b0c8985542709b7a82ada1e',
    instagram: '05db8ad96887e6e633e689a7bf3d8d303549e97d',
    website: 'website' // Native field or mapped custom? Usually 'website' is not a key for custom field, but maybe native. 
                       // Wait, user said "Site - website". If it's a custom field, it has a hash. 
                       // If it's the native field, the key is just 'address' (which contains object) or special logic?
                       // Pipedrive Organizations DO NOT have a native 'website' field in the API v1 root object in the past, 
                       // but often it is handled via custom fields or address. 
                       // HOWEVER, let's assume if user said "website", they might mean a custom field key named "website" 
                       // OR they want us to try the native 'website' param (which exists in addOrganization).
                       // Let's try native 'website' key first.
};

if (!SUPABASE_URL) {
  console.error('❌ Erro: SUPABASE_URL precisa estar definido no arquivo .env');
  process.exit(1);
}

if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_COMPANY_DOMAIN) {
  console.error('❌ Erro: PIPEDRIVE_API_TOKEN e PIPEDRIVE_COMPANY_DOMAIN precisam estar definidos no arquivo .env');
  process.exit(1);
}

// Setup Postgres Pool
const pool = new Pool({
  connectionString: SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const pipedriveClient = axios.create({
  baseURL: `https://${PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/api/v1`,
  params: { api_token: PIPEDRIVE_API_TOKEN },
});

// --- Helpers ---

function normalize(str: string) {
  return str ? str.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

async function getAllPipedriveOrganizations() {
  let allOrgs: any[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  console.log('🔄 Buscando Organizações no Pipedrive...');

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
      console.error('❌ Erro ao buscar organizações:', error.message);
      hasMore = false;
    }
  }
  return allOrgs;
}

async function updatePipedriveOrg(id: number, updates: Record<string, any>) {
  try {
    await pipedriveClient.put(`/organizations/${id}`, updates);
    return true;
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar organização ${id}:`, error.message);
    console.error(`   Payload tentado:`, JSON.stringify(updates));
    return false;
  }
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

// --- Main Script ---

async function main() {
  console.log('🚀 Iniciando script de correção de ORGANIZAÇÕES (IDs FIXOS)...');
  console.log('📋 IDs Configurados:');
  console.log(JSON.stringify(FIELD_IDS, null, 2));

  // 1. Fetch Supabase Data
  console.log(`\n🔄 Buscando dados do Supabase...`);
  let supabaseLeads: any[] = [];
  try {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT * FROM ${SUPABASE_TABLE}`);
        supabaseLeads = res.rows;
    } finally {
        client.release();
    }
  } catch (err: any) {
    console.error('❌ Erro de conexão Supabase:', err.message);
    if (err.message.includes('ENOTFOUND')) {
        console.error('⚠️  Verifique se está usando a URL do Pooler (IPv4) no .env');
    }
    process.exit(1);
  }
  console.log(`✅ ${supabaseLeads.length} leads no Supabase.`);

  // 2. Fetch Pipedrive Data
  const pipedriveOrgs = await getAllPipedriveOrganizations();
  console.log(`✅ ${pipedriveOrgs.length} organizações no Pipedrive.`);

  // 3. Match and Update
  console.log('\n🔄 Iniciando comparação...');
  
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let autoApprove = false;

  for (const org of pipedriveOrgs) {
    const pName = normalize(org.name);
    
    // Match
    const match = supabaseLeads.find((l: any) => normalize(l.name) === pName || normalize(l.full_name) === pName);

    if (match) {
        let updates: any = {};
        let diffs: string[] = [];

        // 1. Telefone (Custom Field)
        const pPhone = org[FIELD_IDS.phone] || '';
        const sPhone = match.phone || match.celular || match.telefone || match.whatsapp || '';
        const cleanPPhone = String(pPhone).replace(/\D/g, '');
        const cleanSPhone = String(sPhone).replace(/\D/g, '');
        if (cleanSPhone && cleanSPhone !== cleanPPhone) {
            updates[FIELD_IDS.phone] = sPhone;
            diffs.push(`📞 Phone: '${pPhone}' -> '${sPhone}'`);
        }

        // 2. Email (Custom Field)
        const pEmail = org[FIELD_IDS.email] || '';
        const sEmail = match.email || '';
        if (sEmail && sEmail !== pEmail) {
            updates[FIELD_IDS.email] = sEmail;
            diffs.push(`📧 Email: '${pEmail}' -> '${sEmail}'`);
        }

        // 3. Instagram (Custom Field)
        const pInsta = org[FIELD_IDS.instagram] || '';
        const sInsta = match.instagram || '';
        if (sInsta && sInsta !== pInsta) {
            updates[FIELD_IDS.instagram] = sInsta;
            diffs.push(`� Instagram: '${pInsta}' -> '${sInsta}'`);
        }

        // 4. Site / Website
        // Assuming 'website' key works for Organization update if user mapped it as such
        // OR if it's a custom field, user should provide hash. 
        // User provided "Site - website", implying key is 'website'.
        // Let's try native key 'website' which Pipedrive sometimes accepts or custom key if user meant that.
        // We will just use what user provided: 'website'.
        const pSite = org[FIELD_IDS.website] || ''; // Might be undefined if not returned by API standard
        const sSite = match.website || match.site || '';
        if (sSite && sSite !== pSite) {
            updates[FIELD_IDS.website] = sSite;
            diffs.push(`🌐 Site: '${pSite}' -> '${sSite}'`);
        }

        // 6. Address (Native)
        const pAddress = org.address || org.address_formatted_address || '';
        const sAddress = match.address || match.endereco || '';
        if (sAddress && (!pAddress || pAddress.length < 5)) {
             updates['address'] = sAddress;
             diffs.push(`📍 Address: '${pAddress}' -> '${sAddress}'`);
        }
        
        // 7. Maps URL & Rating
        // Only if present in Supabase (assuming columns exist: google_maps_link, rating?)
        const sMapsUrl = match.maps_url || match.google_maps_link || '';
        const pMapsUrl = org[FIELD_IDS.maps_url] || '';
        if (sMapsUrl && sMapsUrl !== pMapsUrl) {
            updates[FIELD_IDS.maps_url] = sMapsUrl;
            diffs.push(`🗺️ Maps URL: Update`);
        }
        
        const sRating = match.rating || match.avaliacao; // Number?
        const pRating = org[FIELD_IDS.maps_rating];
        if (sRating && sRating != pRating) {
            updates[FIELD_IDS.maps_rating] = sRating;
            diffs.push(`⭐ Rating: ${pRating} -> ${sRating}`);
        }


        if (Object.keys(updates).length > 0) {
            console.log(`\n🔍 Divergência encontrada: ${org.name}`);
            diffs.forEach(d => console.log(`   🔸 ${d}`));

            let shouldUpdate = false;

            if (autoApprove) {
                shouldUpdate = true;
            } else {
                const answer = await askQuestion('   ❓ Atualizar? (s/n/t/q): ');
                const ans = answer.trim().toLowerCase();
                
                if (ans === 'q') break;
                if (ans === 't') { autoApprove = true; shouldUpdate = true; }
                if (ans === 's') shouldUpdate = true;
            }

            if (shouldUpdate) {
                process.stdout.write('   ⏳ Atualizando... ');
                const success = await updatePipedriveOrg(org.id, updates);
                if (success) {
                    console.log('✅ OK');
                    updatedCount++;
                } else {
                    console.log('❌ Falha');
                }
            } else {
                skippedCount++;
            }
        } else {
            skippedCount++;
        }

    } else {
      notFoundCount++;
    }
  }

  await pool.end();

  console.log('\n📊 Relatório Final:');
  console.log(`✅ Atualizados: ${updatedCount}`);
  console.log(`⏭️  Ignorados: ${skippedCount}`);
  process.exit(0);
}

main();
