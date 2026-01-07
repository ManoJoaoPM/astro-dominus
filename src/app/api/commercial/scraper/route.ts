import { ENV } from "@/env";
import { NextRequest, NextResponse } from "next/server";
import { DataForSEO } from "@/services/commercial/dataforseo";
import { WebsiteScraper } from "@/services/commercial/scraper";
import { CommercialLead } from "@/models/commercial/lead/model";
import { ScraperJob } from "@/models/commercial/scraper-job/model";
import { withSession } from "@/struct";

// Função isolada para processar o scraping em background
function formatPhone(phone: string | null | undefined) {
  if (!phone) return null;
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "");
  // Remove o código do país se começar com 55 e tiver mais de 11 dígitos
  // ou se for exatamente 13 dígitos (55 + 2 DDD + 9 numero)
  let localPhone = cleaned;
  if (localPhone.startsWith("55") && localPhone.length > 11) {
    localPhone = localPhone.substring(2);
  }

  // Formata como (DD) 9XXXX-XXXX
  if (localPhone.length === 11) {
    return `(${localPhone.substring(0, 2)}) ${localPhone.substring(2, 7)}-${localPhone.substring(7)}`;
  }
  // Formata como (DD) XXXX-XXXX
  if (localPhone.length === 10) {
    return `(${localPhone.substring(0, 2)}) ${localPhone.substring(2, 6)}-${localPhone.substring(6)}`;
  }
  
  return phone; // Retorna original se não bater com padrão
}

function cleanPhoneForApi(phone: string): string {
  // Remove tudo que não for número
  const nums = phone.replace(/\D/g, "");
  // Se não tiver DDI (10 ou 11 dígitos), assume 55
  if (nums.length === 10 || nums.length === 11) {
    return "55" + nums;
  }
  return nums;
}

// Mapa de "clean number" -> resultado da verificação
interface WhatsappCheckResult {
  [number: string]: boolean;
}

async function checkWhatsappBatch(numbers: string[]): Promise<WhatsappCheckResult> {
  const uniqueNumbers = [...new Set(numbers.filter((n) => n))];
  if (uniqueNumbers.length === 0) return {};

    if (!ENV.EVOLUTION_APIKEY) {
      console.error("EVOLUTION_APIKEY não está definido");
      return {};
    }

  try {
    const res = await fetch(
      "https://n8n-evolution-api.d88ghw.easypanel.host/chat/whatsappNumbers/2High - Prospecção 2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ENV.EVOLUTION_APIKEY?.toString()
        },
        body: JSON.stringify({ numbers: uniqueNumbers }),
      }
    );

    if (!res.ok) {
      console.error("Erro na API Evolution:", await res.text());
      return {};
    }

    const data = await res.json();
    // Esperado: array de objetos [{ jid: "...", whatsapp_test: { exists: true }, ... }]
    // Ou [{ number: "...", exists: true }]
    // Vamos mapear a resposta.

    const resultMap: WhatsappCheckResult = {};

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        // Tenta achar o número e o status
        // A API evolution costuma retornar o JID como "5511999999999@s.whatsapp.net"
        // E o status em `exists` ou `whatsapp_test.exists`
        
        let exists = false;
        if (item.exists === true) exists = true;
        if (item.whatsapp_test?.exists === true) exists = true;

        // Extrai o número do JID ou do campo number
        const rawNumber = item.jid ? item.jid.split("@")[0] : item.number;
        
        if (rawNumber) {
          resultMap[rawNumber] = exists;
        }
      });
    }

    return resultMap;
  } catch (err) {
    console.error("Erro ao verificar batch whatsapp:", err);
    return {};
  }
}

async function fetchWhatsappFromRocket(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl) return null;
  try {
    let targetUrl = websiteUrl;
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    const apiUrl = `https://rocket-api.d88ghw.easypanel.host/buscar-whatsapp?url=${encodeURIComponent(
      targetUrl
    )}`;
    
    const res = await fetch(apiUrl);
    if (!res.ok) return null;

    const data = await res.json();
    // Esperado: { whatsapp_pesquisa: "5511..." } ou "Não encontrado"
    
    if (data.whatsapp_numero && data.whatsapp_numero !== "Não encontrado") {
       // Limpa o número retornado
       return cleanPhoneForApi(data.whatsapp_numero);
    }

    return null;
  } catch (err) {
    console.error("Erro Rocket Whatsapp:", err);
    return null;
  }
}

async function fetchInstagramFromRocket(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl) return null;
  try {
    // Adiciona protocolo se não tiver
    let targetUrl = websiteUrl;
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    const apiUrl = `https://rocket-api.d88ghw.easypanel.host/extrair_instagram?url=${encodeURIComponent(
      targetUrl
    )}`;

    const res = await fetch(apiUrl);
    if (!res.ok) return null;

    const data = await res.json();
    // A API retorna algo como { instagram: "..." } ou array? 
    // Assumindo que retorna um JSON onde o instagram pode estar.
    // O user disse: "ele retornará as imobiliárias que encontrou o Instagram dentro do site."
    // Vamos logar pra debug se necessário, mas por ora vamos assumir que vem num campo `instagram` ou similar.
    // Se a API retornar direto a string ou um objeto, vamos tentar extrair.
    
    // Ajuste conforme o shape real da resposta da Rocket API se conhecido.
    // Supondo { instagram: "https://instagram.com/..." }
    if (data.instagram) return data.instagram;
    
    return null;
  } catch (err) {
    console.error("Erro ao buscar Instagram na Rocket API:", err);
    return null;
  }
}

async function runScraperJob(jobId: string, city: string) {
  //console.log(`[Scraper] Iniciando job ${jobId} para cidade: ${city}`);
  try {
    const items = await DataForSEO.fetchMapsData(city);
    //console.log(`[Scraper] DataForSEO retornou ${items.length} itens.`);

    let count = 0;
    let withEmail = 0;
    let withPhone = 0;
    let withWebsite = 0;
    let withInstagram = 0;

    // Estrutura para armazenar dados processados antes de salvar
    // Precisamos separar quem tem telefone para validar em lote
    const candidates: any[] = [];
    const initialNumbersToCheck: string[] = [];

    for (const item of items) {
      let whatsapp = null;
      // Tenta achar whatsapp na URL (padrão antigo, mantido caso Rocket falhe ou como complemento)
      if (item.url && !item.phone) {
         whatsapp = await WebsiteScraper.findWhatsApp(item.url);
      }
      
      const formattedPhone = formatPhone(item.phone); // (XX) XXXXX-XXXX
      const rawPhone = item.phone ? cleanPhoneForApi(item.phone) : null;
      const rawWhatsapp = whatsapp ? cleanPhoneForApi(whatsapp) : null;

      // Se tiver número, adiciona na lista de verificação inicial
      if (rawPhone) initialNumbersToCheck.push(rawPhone);
      if (rawWhatsapp) initialNumbersToCheck.push(rawWhatsapp);

      candidates.push({
        item,
        formattedPhone,
        rawPhone,
        rawWhatsapp,
        website: item.url,
        finalPhone: null as string | null, // Vai ser preenchido após validações
        instagram: null as string | null,
      });
    }

    // 1. Verificação em Lote Inicial (Evolution) -> REMOVIDA
    // const initialCheckResults = await checkWhatsappBatch(initialNumbersToCheck);

    // 2. Processamento individual (Rocket + Instagram)
    // const newNumbersToCheck: string[] = [];
    
    // Passo intermediário: define quem passou e quem precisa de Rocket
    for (const [index, candidate] of candidates.entries()) {
      // console.log(`[Scraper] Processando candidato ${index + 1}/${candidates.length}: ${candidate.item.title}`);
       let finalPhone = null;

       // 1. Tenta buscar no Rocket primeiro (prioridade conforme solicitado?)
       // O usuário disse: "apenas quero que ele tente puxar o número de dentro do site utilizando o Rocket, caso não seja encontrado ... fique salvo o do próprio Google Maps"
       // Isso inverte a lógica anterior. Antes priorizava Google/Evolution.
       
       if (candidate.website) {
          //console.log(`[Scraper] Buscando WhatsApp no Rocket para site: ${candidate.website}`);
          const rocketNumber = await fetchWhatsappFromRocket(candidate.website);
          if (rocketNumber) {
             //console.log(`[Scraper] Rocket encontrou: ${rocketNumber}`);
             finalPhone = rocketNumber;
          } else {
             //console.log(`[Scraper] Rocket não encontrou WhatsApp.`);
          }
       }

       // 2. Se Rocket falhou, usa o do Google Maps (se existir)
       if (!finalPhone) {
          if (candidate.rawPhone) {
             finalPhone = candidate.rawPhone;
             //console.log(`[Scraper] Usando telefone do Google Maps: ${finalPhone}`);
          } else if (candidate.rawWhatsapp) {
             finalPhone = candidate.rawWhatsapp;
             //console.log(`[Scraper] Usando WhatsApp extraído da URL (legado): ${finalPhone}`);
          }
       }

       // 3. Se ainda não tem, fica "0" (conforme regra anterior, ou null)
       // Se não tem telefone em lugar nenhum, é melhor salvar como null ou "0"?
       // Código anterior usava "0".
       if (!finalPhone) {
          //console.log(`[Scraper] Nenhum telefone encontrado. Salvando como "0".`);
       }
       candidate.finalPhone = finalPhone || "0";
       
       // Já aproveita pra buscar Instagram (Rocket) em paralelo ou aqui mesmo
       if (candidate.website && !candidate.website.includes("instagram.com")) {
          //console.log(`[Scraper] Buscando Instagram no Rocket para: ${candidate.website}`);
          candidate.rocketInstagram = await fetchInstagramFromRocket(candidate.website);
          if (candidate.rocketInstagram) {
             //console.log(`[Scraper] Rocket encontrou Instagram: ${candidate.rocketInstagram}`);
          }
       }
    }

    // Set para controlar Instagrams duplicados no mesmo lote
    const seenInstagrams = new Set<string>();

    // 4. Consolidação Final e Salvamento
    //console.log(`[Scraper] Iniciando salvamento no banco de dados...`);
    for (const candidate of candidates) {
       // A lógica de verificação secundária (Evolution) foi removida conforme pedido:
       // "Vamos tirar a verificação do Whatsapp"
       
       // Formata o telefone final se não for 0
       let phoneToSave = candidate.finalPhone;
       if (phoneToSave && phoneToSave !== "0") {
          phoneToSave = formatPhone(phoneToSave); 
       }

       // Lógica de Instagram
       let finalInstagram = candidate.rocketInstagram || 
         (candidate.website && candidate.website.includes("instagram.com") ? candidate.website : null);

       // VERIFICAÇÃO DE INSTAGRAM REPETIDO NO LOTE
       if (finalInstagram) {
          if (seenInstagrams.has(finalInstagram)) {
             // Se já vimos esse Instagram neste lote, assumimos erro do scraper/API e descartamos para este lead
             // (A menos que seja a mesma empresa, mas por segurança para evitar spam de leads errados, limpamos)
             //console.log(`[Scraper] Instagram duplicado detectado e ignorado: ${finalInstagram} para ${candidate.item.title}`);
             finalInstagram = null;
          } else {
             seenInstagrams.add(finalInstagram);
          }
       }

       // Contadores
       if (phoneToSave && phoneToSave !== "0") withPhone++;
       if (finalInstagram) withInstagram++;
       if (candidate.item.email) withEmail++;
       if (candidate.website) withWebsite++;

       // Unicidade (Adaptada) - Agora muito mais estrita conforme pedido
       const existingQuery: any[] = [];
       
       // 1. Verifica por Website (muito forte)
       if (candidate.website) existingQuery.push({ website: candidate.website });
       
       // 2. Verifica por Telefone (forte)
       if (phoneToSave && phoneToSave !== "0") existingQuery.push({ phone: phoneToSave });
       
       // 3. Verifica por Instagram (forte)
       if (finalInstagram) existingQuery.push({ instagram: finalInstagram });
       
       // 4. Verifica por Endereço (forte, se exato)
       if (candidate.item.address) existingQuery.push({ address: candidate.item.address });
       
       // 5. Fallback: Nome + Cidade (caso os outros falhem, mas perigoso com abreviações)
       // Se tivermos qualquer um dos identificadores fortes acima, talvez não precisemos do nome+cidade?
       // O problema do "BH" vs "Belo Horizonte" é que "Nome + Cidade" falha em pegar o duplicado.
       // Mas se tiver endereço, site ou instagram, os checks acima pegam.
       // Mantemos Nome+Cidade apenas se NÃO tivermos nada melhor?
       // O código original fazia: if (existingQuery.length === 0) ...
       // Vamos manter essa lógica: se não tem site, nem telefone, nem insta, nem endereço... (o que é raro), tentamos nome+cidade.
       
       if (existingQuery.length === 0) {
          existingQuery.push({ name: candidate.item.title, city: city });
       } else {
          // Se já temos critérios fortes, adicionamos também Nome+Cidade como OPÇÃO, 
          // mas cuidado: se adicionarmos no $or array, ele vai dar match se QUALQUER um bater.
          // Queremos que se o Site bater, É duplicado. Se o Endereço bater, É duplicado.
          // Então adicionar mais critérios ao $or AUMENTA a chance de achar duplicado (o que queremos).
          // Vamos adicionar Nome+Cidade ao array de busca também?
          // Não, porque "Nome + Cidade" é onde ocorre o erro de "Belo Horizonte" vs "BH".
          // Se buscarmos por "Nome + BH", não acharemos o lead "Nome + Belo Horizonte".
          // Então adicionar isso não ajuda a achar o duplicado, só ajuda a achar se for exato.
          // Vamos manter como fallback.
       }

       // A query é um OR. Se encontrar por Site OU Telefone OU Instagram OU Endereço, retorna.
       const existingLead = await CommercialLead.findOne({ $or: existingQuery });
       if (existingLead) {
          // Check if we need to enrich existing lead
          let needsUpdate = false;
          
          // Update Phone if missing or "0"
          if ((!existingLead.phone || existingLead.phone === "0") && phoneToSave && phoneToSave !== "0") {
             existingLead.phone = phoneToSave;
             needsUpdate = true;
          }
          
          // Update Instagram if missing
          if (!existingLead.instagram && finalInstagram) {
             existingLead.instagram = finalInstagram;
             needsUpdate = true;
          }
          
          // Update Website if missing
          if (!existingLead.website && candidate.website) {
             existingLead.website = candidate.website;
             needsUpdate = true;
          }
          
          // Update Email if missing
          if (!existingLead.email && candidate.item.email) {
             existingLead.email = candidate.item.email;
             needsUpdate = true;
          }
          
          // Update Rating/Reviews if missing
          // Normalize rating object from API
          // API returns rating: { value: 4.8, votes_count: 100 } or just number sometimes?
          // Based on error log: { rating_type: 'Max5', value: 5, votes_count: 272, rating_max: null }
          let ratingValue = candidate.item.rating;
          let reviewsValue = candidate.item.reviews; // reviews usually holds the count if rating is simple number, but if rating is object, votes_count is there

          if (ratingValue && typeof ratingValue === 'object') {
             if (ratingValue.value) ratingValue = ratingValue.value;
             if (ratingValue.votes_count) reviewsValue = ratingValue.votes_count;
          }

          if (!existingLead.rating && ratingValue) {
             existingLead.rating = ratingValue;
             needsUpdate = true;
          }
          if (!existingLead.reviews && reviewsValue) {
             existingLead.reviews = reviewsValue;
             needsUpdate = true;
          }
          
          if (needsUpdate) {
             await existingLead.save();
             //console.log(`[Scraper] Lead enriquecido: ${candidate.item.title}`);
          }
          
          //console.log(`[Scraper] Lead duplicado (processado): ${candidate.item.title}`);
          continue;
       }

       // Normalize rating
        let ratingValue = candidate.item.rating;
        let reviewsValue = candidate.item.reviews;

        if (ratingValue && typeof ratingValue === 'object') {
           if (ratingValue.value) ratingValue = ratingValue.value;
           if (ratingValue.votes_count) reviewsValue = ratingValue.votes_count;
        }

        await CommercialLead.create({
          name: candidate.item.title,
          city: city,
          address: candidate.item.address,
          phone: phoneToSave, 
          website: candidate.website,
          instagram: finalInstagram,
          lat: candidate.item.latitude,
          lng: candidate.item.longitude,
          rating: ratingValue,
          reviews: reviewsValue,
          scraperJobId: jobId,
        });
       count++;
       //console.log(`[Scraper] Lead salvo: ${candidate.item.title}`);
    }

    //console.log(`[Scraper] Job finalizado. Total salvo: ${count}`);
    await ScraperJob.findByIdAndUpdate(jobId, {
      status: "completed",
      totalLeads: count,
      withEmail,
      withPhone,
      withWebsite,
      withInstagram,
      finishedAt: new Date(),
    });
  } catch (err: any) {
    console.error("Scraping Job Error:", err);
    await ScraperJob.findByIdAndUpdate(jobId, {
      status: "failed",
      errorMessage: err.message,
    });
  }
}

export const POST = withSession(async ({ user }, req: NextRequest) => {
  try {
    const body = await req.json();
    const { city } = body;

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    // Create Job
    const job = await ScraperJob.create({
      query: `imobiliaria ${city}`,
      city,
      status: "running",
    });

    // Start Async Process (Fire and Forget)
    runScraperJob(job._id as string, city);

    return NextResponse.json({ success: true, jobId: job._id });
  } catch (error) {
    console.error("Scraper Endpoint Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const GET = withSession(async ({ user }, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  if (city) {
    // Return aggregation of leads count by city or jobs for that city
    const jobs = await ScraperJob.find({ city })
      .sort({ startedAt: -1 })
      .limit(5);
    return NextResponse.json({ jobs });
  }

  // Return summary of cities
  // Aggregate CommercialLead to count by city
  const summary = await CommercialLead.aggregate([
    { $match: { city: { $ne: null } } },
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return NextResponse.json({ cities: summary });
});
