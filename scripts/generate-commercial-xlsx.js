const axios = require("axios");
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE_URL = process.env.SEARCHAPI_BASE_URL || "https://www.searchapi.io/api/v1";
const SEARCHAPI_HL = (process.env.SEARCHAPI_HL || "pt-br").toLowerCase();
const SEARCHAPI_GL = (process.env.SEARCHAPI_GL || "br").toLowerCase();
const DEPTH_DEFAULT = Number(process.env.DEPTH || process.env.DFS_DEPTH || 200);

const ROCKET_BASE_URL = process.env.ROCKET_BASE_URL || "https://rocket-api.d88ghw.easypanel.host";
const ROCKET_TIMEOUT_MS = Number(process.env.ROCKET_TIMEOUT_MS || 30000);

const OUTPUT_DEFAULT = `commercial_${new Date().toISOString().slice(0, 10)}.xlsx`;

const TARGETS = [
  {
    segment: "Loja de Material de Construção",
    keywords: [
      "loja de material de construção",
      "materiais de construção",
      "depósito de material de construção",
      "casa de material de construção",
      "distribuidora de material de construção",
    ],
  },
  {
    segment: "Construtora",
    keywords: ["construtora", "empreiteira", "construção civil", "incorporadora"],
  },
];

const CITIES = [
  { city: "Campos dos Goytacazes", state: "RJ" },
  { city: "Macaé", state: "RJ" },
  { city: "Cabo Frio", state: "RJ" },
  { city: "Arraial do Cabo", state: "RJ" },
  { city: "Búzios", state: "RJ" },
  { city: "Rio das Ostras", state: "RJ" },
];

function parseArgs(argv) {
  const args = { out: OUTPUT_DEFAULT, depth: DEPTH_DEFAULT, rocket: true, concurrency: 6 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--out" && next) {
      args.out = next;
      i++;
      continue;
    }
    if (a === "--depth" && next) {
      args.depth = Number(next);
      i++;
      continue;
    }
    if (a === "--no-rocket") {
      args.rocket = false;
      continue;
    }
    if (a === "--concurrency" && next) {
      args.concurrency = Math.max(1, Number(next) || 1);
      i++;
      continue;
    }
  }
  return args;
}

function toStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeWhitespace(s) {
  return toStr(s).trim().replace(/\s+/g, " ");
}

function getSearchApiKey() {
  return normalizeWhitespace(SEARCHAPI_API_KEY);
}

function normalizeWebsite(url) {
  const s = normalizeWhitespace(url);
  if (!s) return "";
  const cleaned = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
  return cleaned.toLowerCase();
}

function normalizeInstagram(url) {
  const s = normalizeWhitespace(url);
  if (!s) return "";
  const cleaned = s
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  if (!cleaned.includes("instagram.com")) return "";
  return cleaned;
}

function normalizeAddress(addr) {
  const s = normalizeWhitespace(addr);
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[.,;#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPhoneDigits(phone) {
  const s = toStr(phone).replace(/\D/g, "");
  if (!s) return "";
  if (s.startsWith("55") && s.length > 11) return s.slice(2);
  return s;
}

function cleanPhoneForApi(phone) {
  const nums = toStr(phone).replace(/\D/g, "");
  if (!nums) return "";
  if (nums.length === 10 || nums.length === 11) return "55" + nums;
  return nums;
}

function formatPhone(phone) {
  const local = cleanPhoneDigits(phone);
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return normalizeWhitespace(phone);
}

function normalizeName(name) {
  return normalizeWhitespace(name).toLowerCase();
}

function extractRating(item) {
  const ratingRaw = item?.rating;
  const reviewsRaw = item?.reviews;
  let rating = ratingRaw;
  let reviews = reviewsRaw;
  if (rating && typeof rating === "object") {
    if (rating.value != null) rating = rating.value;
    if (rating.votes_count != null) reviews = rating.votes_count;
  }
  const ratingNum = rating == null || rating === "" ? "" : Number(rating);
  const reviewsNum = reviews == null || reviews === "" ? "" : Number(reviews);
  return { rating: Number.isFinite(ratingNum) ? ratingNum : "", reviews: Number.isFinite(reviewsNum) ? reviewsNum : "" };
}

function extractInstagramFromItem(item) {
  const candidates = [];
  if (Array.isArray(item?.profiles)) candidates.push(...item.profiles);
  if (Array.isArray(item?.social_media)) candidates.push(...item.social_media);
  if (Array.isArray(item?.links)) candidates.push(...item.links);
  for (const c of candidates) {
    const s = toStr(c);
    if (s.includes("instagram.com")) return s;
  }
  return "";
}

function makeMapsUrl(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latNum},${lngNum}`)}`;
}

async function fetchMapsItems(keyword, depth) {
  const apiKey = getSearchApiKey();
  if (!apiKey) throw new Error("missing SEARCHAPI_API_KEY");

  const max = Math.max(1, Number(depth) || 1);
  const collected = [];
  const seen = new Set();

  for (let page = 1; collected.length < max; page++) {
    const res = await axios.get(`${SEARCHAPI_BASE_URL.replace(/\/+$/, "")}/search`, {
      params: {
        engine: "google_maps",
        q: keyword,
        hl: SEARCHAPI_HL,
        gl: SEARCHAPI_GL,
        page,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 90000,
      validateStatus: () => true,
    });

    if (res.status < 200 || res.status >= 300) {
      const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data || {}).slice(0, 500);
      throw new Error(`SearchAPI HTTP ${res.status}: ${msg}`);
    }

    const batch = Array.isArray(res.data?.local_results) ? res.data.local_results : [];
    if (batch.length === 0) break;

    for (const item of batch) {
      const id = normalizeWhitespace(item?.place_id || item?.ludocid || item?.data_id || "");
      const dedupeKey = id || normalizeWhitespace(item?.title || "");
      if (!dedupeKey) continue;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      collected.push(item);
      if (collected.length >= max) break;
    }
  }

  return collected;
}

async function fetchWhatsappFromRocket(websiteUrl) {
  const s = normalizeWhitespace(websiteUrl);
  if (!s) return "";
  let targetUrl = s;
  if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;
  const apiUrl = `${ROCKET_BASE_URL.replace(/\/+$/, "")}/buscar-whatsapp?url=${encodeURIComponent(targetUrl)}`;
  try {
    const res = await axios.get(apiUrl, { timeout: ROCKET_TIMEOUT_MS, validateStatus: () => true });
    if (res.status < 200 || res.status >= 300) return "";
    const data = res.data;
    const num = data?.whatsapp_numero || data?.whatsapp_pesquisa || "";
    if (!num || num === "Não encontrado") return "";
    return cleanPhoneForApi(num);
  } catch {
    return "";
  }
}

async function fetchInstagramFromRocket(websiteUrl) {
  const s = normalizeWhitespace(websiteUrl);
  if (!s) return "";
  let targetUrl = s;
  if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;
  const apiUrl = `${ROCKET_BASE_URL.replace(/\/+$/, "")}/extrair_instagram?url=${encodeURIComponent(targetUrl)}`;
  try {
    const res = await axios.get(apiUrl, { timeout: ROCKET_TIMEOUT_MS, validateStatus: () => true });
    if (res.status < 200 || res.status >= 300) return "";
    const data = res.data;
    const insta = toStr(data?.instagram || "");
    return insta;
  } catch {
    return "";
  }
}

async function asyncPool(limit, items, fn) {
  const executing = new Set();
  const results = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.allSettled(results);
}

function mergeLead(base, incoming) {
  const take = (k) => {
    const v = incoming[k];
    if (v == null) return;
    if (typeof v === "string" && !v.trim()) return;
    if (Array.isArray(v) && v.length === 0) return;
    if (base[k] == null || (typeof base[k] === "string" && !base[k].trim())) base[k] = v;
  };
  for (const k of Object.keys(incoming)) take(k);
  if (incoming.queries && incoming.queries.size) {
    base.queries = base.queries || new Set();
    for (const q of incoming.queries) base.queries.add(q);
  }
}

function addIndexes(indexes, id, lead) {
  if (lead.website_norm) indexes.byWebsite.set(lead.website_norm, id);
  if (lead.phone_best_digits) indexes.byPhone.set(lead.phone_best_digits, id);
  if (lead.instagram_norm) indexes.byInstagram.set(lead.instagram_norm, id);
  if (lead.address_norm) indexes.byAddress.set(`${lead.address_norm}|${lead.city}|${lead.segment}`, id);
  if (lead.name_norm) indexes.byName.set(`${lead.name_norm}|${lead.city}|${lead.segment}`, id);
}

function repointIndexes(indexes, fromId, toId) {
  for (const m of [indexes.byWebsite, indexes.byPhone, indexes.byInstagram, indexes.byAddress, indexes.byName]) {
    for (const [k, v] of m.entries()) {
      if (v === fromId) m.set(k, toId);
    }
  }
}

function upsertLead(state, candidate) {
  const { leads, indexes } = state;
  const matches = new Set();
  if (candidate.website_norm && indexes.byWebsite.has(candidate.website_norm)) matches.add(indexes.byWebsite.get(candidate.website_norm));
  if (candidate.phone_best_digits && indexes.byPhone.has(candidate.phone_best_digits)) matches.add(indexes.byPhone.get(candidate.phone_best_digits));
  if (candidate.instagram_norm && indexes.byInstagram.has(candidate.instagram_norm)) matches.add(indexes.byInstagram.get(candidate.instagram_norm));
  if (candidate.address_norm && indexes.byAddress.has(`${candidate.address_norm}|${candidate.city}|${candidate.segment}`))
    matches.add(indexes.byAddress.get(`${candidate.address_norm}|${candidate.city}|${candidate.segment}`));
  if (candidate.name_norm && indexes.byName.has(`${candidate.name_norm}|${candidate.city}|${candidate.segment}`))
    matches.add(indexes.byName.get(`${candidate.name_norm}|${candidate.city}|${candidate.segment}`));

  const ids = Array.from(matches).filter(Boolean);
  if (ids.length === 0) {
    const id = uuidv4();
    leads.set(id, candidate);
    addIndexes(indexes, id, candidate);
    return { id, merged: 0, created: true };
  }

  const baseId = ids[0];
  const base = leads.get(baseId);
  mergeLead(base, candidate);
  for (let i = 1; i < ids.length; i++) {
    const otherId = ids[i];
    const other = leads.get(otherId);
    if (!other) continue;
    mergeLead(base, other);
    leads.delete(otherId);
    repointIndexes(indexes, otherId, baseId);
  }
  addIndexes(indexes, baseId, base);
  return { id: baseId, merged: ids.length - 1, created: false };
}

function makeCandidateFromItem({ item, city, state, segment, keyword }) {
  const name = normalizeWhitespace(item?.title || item?.name || item?.business_name || item?.domain || "");
  if (!name) return null;

  const address = normalizeWhitespace(item?.address || item?.full_address || "");
  const website = normalizeWhitespace(item?.website || item?.url || item?.site || item?.domain || "");
  const email = normalizeWhitespace(item?.email || item?.contact_info?.email || (Array.isArray(item?.emails) ? item.emails[0] : ""));
  const instaFromItem = extractInstagramFromItem(item);
  const instagram = normalizeWhitespace(instaFromItem) || (website.includes("instagram.com") ? website : "");

  const phoneGoogleRaw = cleanPhoneForApi(item?.phone || (Array.isArray(item?.phone_numbers) ? item.phone_numbers[0] : ""));
  const phoneGoogleDigits = phoneGoogleRaw ? cleanPhoneDigits(phoneGoogleRaw) : "";
  const phoneGoogleFormatted = phoneGoogleRaw ? formatPhone(phoneGoogleRaw) : "";

  const { rating, reviews } = extractRating(item);

  const lat = item?.gps_coordinates?.latitude ?? item?.latitude ?? "";
  const lng = item?.gps_coordinates?.longitude ?? item?.longitude ?? "";
  const mapsUrl = makeMapsUrl(lat, lng);

  const websiteNorm = normalizeWebsite(website);
  const instagramNorm = normalizeInstagram(instagram);
  const addressNorm = normalizeAddress(address);
  const nameNorm = normalizeName(name);

  const candidate = {
    id: "",
    segment,
    keyword,
    city,
    state,
    name,
    address,
    phone_google_raw: phoneGoogleRaw,
    phone_google_formatted: phoneGoogleFormatted,
    whatsapp_raw: "",
    phone_best_raw: phoneGoogleRaw,
    phone_best_formatted: phoneGoogleFormatted,
    phone_best_digits: phoneGoogleDigits,
    email,
    website,
    instagram,
    lat,
    lng,
    maps_url: mapsUrl,
    rating,
    reviews,
    category: normalizeWhitespace(item?.type || item?.category || ""),
    place_id: normalizeWhitespace(item?.place_id || ""),
    cid: normalizeWhitespace(item?.ludocid || item?.data_id || item?.cid || ""),
    queries: new Set([`${segment} :: ${keyword} :: ${city}/${state}`]),
    website_norm: websiteNorm,
    instagram_norm: instagramNorm,
    address_norm: addressNorm,
    name_norm: nameNorm,
  };

  return candidate;
}

function finalizeLead(lead) {
  const queries = lead.queries && lead.queries.size ? Array.from(lead.queries).sort().join(" | ") : "";
  return {
    segment: lead.segment,
    city: lead.city,
    state: lead.state,
    name: lead.name,
    address: lead.address,
    phone_best: lead.phone_best_formatted || "",
    whatsapp_e164: lead.whatsapp_raw || "",
    phone_google: lead.phone_google_formatted || "",
    email: lead.email || "",
    website: lead.website || "",
    instagram: lead.instagram || "",
    rating: lead.rating === "" ? "" : lead.rating,
    reviews: lead.reviews === "" ? "" : lead.reviews,
    lat: lead.lat === "" ? "" : lead.lat,
    lng: lead.lng === "" ? "" : lead.lng,
    maps_url: lead.maps_url || "",
    category: lead.category || "",
    place_id: lead.place_id || "",
    cid: lead.cid || "",
    queries,
  };
}

function summarize(leadsRows) {
  const byCitySegment = new Map();
  const key = (city, segment) => `${city}||${segment}`;
  for (const r of leadsRows) {
    const k = key(r.city, r.segment);
    const cur = byCitySegment.get(k) || { city: r.city, segment: r.segment, total: 0, with_phone: 0, with_website: 0, with_instagram: 0, with_email: 0 };
    cur.total += 1;
    if (normalizeWhitespace(r.phone_best)) cur.with_phone += 1;
    if (normalizeWhitespace(r.website)) cur.with_website += 1;
    if (normalizeWhitespace(r.instagram)) cur.with_instagram += 1;
    if (normalizeWhitespace(r.email)) cur.with_email += 1;
    byCitySegment.set(k, cur);
  }
  return Array.from(byCitySegment.values()).sort((a, b) => (a.city + a.segment).localeCompare(b.city + b.segment, "pt-BR"));
}

async function main() {
  const args = parseArgs(process.argv);

  if (!SEARCHAPI_API_KEY) {
    console.error("missing SEARCHAPI_API_KEY");
    process.exit(2);
  }

  const state = {
    leads: new Map(),
    indexes: {
      byWebsite: new Map(),
      byPhone: new Map(),
      byInstagram: new Map(),
      byAddress: new Map(),
      byName: new Map(),
    },
  };

  const queryStats = [];

  console.log(`SearchAPI depth=${args.depth} hl=${SEARCHAPI_HL} gl=${SEARCHAPI_GL}`);
  console.log(`cities=${CITIES.length} segments=${TARGETS.length} rocket=${args.rocket ? "on" : "off"} concurrency=${args.concurrency}`);

  for (const c of CITIES) {
    for (const t of TARGETS) {
      for (const kw of t.keywords) {
        const keyword = `${kw} ${c.city}, ${c.state}`;
        console.log(`fetch: ${t.segment} :: ${keyword}`);
        let items = [];
        let error = "";
        const startedAt = Date.now();
        try {
          items = await fetchMapsItems(keyword, args.depth);
        } catch (e) {
          error = e?.message || String(e);
        }
        const elapsedMs = Date.now() - startedAt;

        let created = 0;
        let merged = 0;
        if (!error) {
          for (const item of items) {
            const candidate = makeCandidateFromItem({ item, city: c.city, state: c.state, segment: t.segment, keyword: kw });
            if (!candidate) continue;
            const res = upsertLead(state, candidate);
            if (res.created) created += 1;
            merged += res.merged;
          }
        }

        queryStats.push({
          city: c.city,
          state: c.state,
          segment: t.segment,
          keyword: kw,
          items: items.length,
          leads_created: created,
          leads_merged: merged,
          error,
          elapsed_ms: elapsedMs,
        });
      }
    }
  }

  console.log(`base leads: ${state.leads.size}`);

  if (args.rocket) {
    const toEnrich = [];
    for (const [id, lead] of state.leads.entries()) {
      const website = normalizeWhitespace(lead.website);
      if (!website) continue;
      const needsWhatsapp = !normalizeWhitespace(lead.whatsapp_raw);
      const needsInstagram = !normalizeWhitespace(lead.instagram) || !normalizeInstagram(lead.instagram);
      if (needsWhatsapp || needsInstagram) {
        toEnrich.push({ id, website, needsWhatsapp, needsInstagram });
      }
    }

    console.log(`rocket enrich queue: ${toEnrich.length}`);

    await asyncPool(args.concurrency, toEnrich, async (job) => {
      const lead = state.leads.get(job.id);
      if (!lead) return;

      const tasks = [];
      if (job.needsWhatsapp) tasks.push(fetchWhatsappFromRocket(job.website));
      else tasks.push(Promise.resolve(""));
      if (job.needsInstagram) tasks.push(fetchInstagramFromRocket(job.website));
      else tasks.push(Promise.resolve(""));

      const [whatsapp, insta] = await Promise.all(tasks);

      if (normalizeWhitespace(whatsapp)) {
        lead.whatsapp_raw = whatsapp;
        lead.phone_best_raw = whatsapp;
        lead.phone_best_formatted = formatPhone(whatsapp);
        lead.phone_best_digits = cleanPhoneDigits(whatsapp);
      }

      const instaNorm = normalizeInstagram(insta);
      if (instaNorm) {
        lead.instagram = insta;
        lead.instagram_norm = instaNorm;
      }

      addIndexes(state.indexes, job.id, lead);
    });
  }

  const rows = Array.from(state.leads.values())
    .map(finalizeLead)
    .sort((a, b) => (a.city + a.segment + a.name).localeCompare(b.city + b.segment + b.name, "pt-BR"));

  const resumo = summarize(rows);

  const wb = XLSX.utils.book_new();
  const wsLeads = XLSX.utils.json_to_sheet(rows);
  const wsResumo = XLSX.utils.json_to_sheet(resumo);
  const wsQueries = XLSX.utils.json_to_sheet(queryStats);

  XLSX.utils.book_append_sheet(wb, wsLeads, "Leads");
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
  XLSX.utils.book_append_sheet(wb, wsQueries, "Consultas");

  XLSX.writeFile(wb, args.out);

  const errors = queryStats.filter((q) => q.error);
  console.log(`xlsx: ${args.out}`);
  console.log(`leads: ${rows.length}`);
  console.log(`queries: ${queryStats.length} errors: ${errors.length}`);
  if (errors.length) {
    console.log("first_errors:", errors.slice(0, 5).map((e) => ({ city: e.city, segment: e.segment, keyword: e.keyword, error: String(e.error).slice(0, 200) })));
  }
}

main().catch((e) => {
  console.error("failed", e?.message || e);
  process.exit(1);
});
