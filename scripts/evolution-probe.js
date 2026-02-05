const axios = require("axios");

const normalizeUrl = (input) => String(input || "").trim().replace(/^['"`\s]+|['"`\s]+$/g, "").replace(/\/$/, "");

async function main() {
  const base = normalizeUrl(process.env.EVOLUTION_API_URL);
  const apiKey = process.env.EVOLUTION_API_KEY || process.env.EVOLUTION_APIKEY;

  if (!base) {
    console.error("missing EVOLUTION_API_URL");
    process.exit(2);
  }
  if (!apiKey) {
    console.error("missing EVOLUTION_API_KEY");
    process.exit(2);
  }

  const headers = { apikey: apiKey, "Content-Type": "application/json" };
  const instanceName = "__probe__does_not_exist__";

  const payload = {
    webhook: {
      enabled: true,
      url: "https://example.com/api/webhooks/evolution",
      headers: {},
      byEvents: true,
      base64: false,
      events: ["QRCODE_UPDATED"],
    },
  };

  try {
    await axios.post(`${base}/webhook/set/${instanceName}`, payload, { headers });
    console.log("webhook_set: ok");
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.log("webhook_set: fail", status || "no_status");
    if (data) console.log(JSON.stringify(data).slice(0, 600));
  }
}

main().catch((e) => {
  console.error("probe_failed", e?.message || e);
  process.exit(1);
});

