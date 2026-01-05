"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl, {
  Map as MapLibreMap,
  Popup,
  LngLatBoundsLike,
} from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

type LeadStatus = "pending" | "qualified" | "unqualified";

type LeadMapItem = {
  _id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  instagram?: string | null;
  website?: string | null;
  qualificationStatus: LeadStatus;
  lat: number;
  lng: number;
  createdAt: string;
};

function statusLabel(s: LeadStatus) {
  if (s === "pending") return "Pendente";
  if (s === "qualified") return "Qualificado";
  return "Desqualificado";
}

function statusPinColor(s: LeadStatus) {
  // Você pode trocar depois por cores da sua UI
  if (s === "qualified") return "#16a34a"; // verde
  if (s === "unqualified") return "#dc2626"; // vermelho
  return "#2563eb"; // azul (pendente)
}

export default function CommercialLeadsMapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);

  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadMapItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");
  const [q, setQ] = useState("");

  const filteredQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (city.trim()) params.set("city", city.trim());
    if (stateUF.trim()) params.set("state", stateUF.trim());
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [status, city, stateUF, q]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lead/map?${filteredQuery}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setLeads(json.leads || []);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredQuery]);

  // init map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json", // grátis (demo). Troque por tiles próprios depois.
      center: [-46.6333, -23.5505], // default SP
      zoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    mapRef.current = map;

    map.on("load", async () => {
    // 1) Estados (UF) - IBGE overlay
        map.addSource("br-uf", {
        type: "geojson",
        data: "/geo/br_uf_2024_simplified.geojson",
        });

        map.addLayer({
        id: "br-uf-fill",
        type: "fill",
        source: "br-uf",
        paint: {
            "fill-color": "rgba(15, 23, 42, 0.03)",
        },
        });

        map.addLayer({
        id: "br-uf-line",
        type: "line",
        source: "br-uf",
        paint: {
            "line-color": "rgba(15, 23, 42, 0.35)",
            "line-width": 1.2,
        },
        });

        // 2) Labels das UFs (opcional)
        map.addSource("br-uf-labels", {
        type: "geojson",
        data: "/geo/br_uf_labels.geojson",
        });

        map.addLayer({
        id: "br-uf-labels",
        type: "symbol",
        source: "br-uf-labels",
        layout: {
            "text-field": [
            "coalesce",
            ["get", "SIGLA_UF"],
            ["get", "sigla"],
            ["get", "NM_UF"],
            ["get", "name"],
            ],
            "text-size": 12,
        },
        paint: {
            "text-color": "rgba(15, 23, 42, 0.55)",
            "text-halo-color": "rgba(255,255,255,0.85)",
            "text-halo-width": 1,
        },
        });
     });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers whenever leads change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    popupRef.current?.remove();
    popupRef.current = null;

    if (!leads.length) return;

    // bounds to fit
    let minLng = leads[0].lng;
    let maxLng = leads[0].lng;
    let minLat = leads[0].lat;
    let maxLat = leads[0].lat;

    for (const lead of leads) {
      minLng = Math.min(minLng, lead.lng);
      maxLng = Math.max(maxLng, lead.lng);
      minLat = Math.min(minLat, lead.lat);
      maxLat = Math.max(maxLat, lead.lat);

      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "999px";
      el.style.background = statusPinColor(lead.qualificationStatus);
      el.style.border = "2px solid rgba(255,255,255,0.9)";
      el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.25)";
      el.style.cursor = "pointer";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lead.lng, lead.lat])
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedId(lead._id);
        flyToLead(lead);
        openPopup(lead);
      });

      markersRef.current.set(lead._id, marker);
    }

    const bounds: LngLatBoundsLike = [
      [minLng, minLat],
      [maxLng, maxLat],
    ];

    // fit once after markers
    map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  function openPopup(lead: LeadMapItem) {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();

    const content = document.createElement("div");
    content.style.maxWidth = "260px";
    content.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.marginBottom = "6px";
    title.textContent = lead.name;

    const meta = document.createElement("div");
    meta.style.fontSize = "12px";
    meta.style.opacity = "0.8";
    meta.style.marginBottom = "10px";
    meta.textContent = `${statusLabel(lead.qualificationStatus)} • ${lead.city || "-"}${lead.state ? `/${lead.state}` : ""}`;

    const addr = document.createElement("div");
    addr.style.fontSize = "12px";
    addr.style.marginBottom = "10px";
    addr.textContent = lead.address || "";

    const links = document.createElement("div");
    links.style.display = "flex";
    links.style.gap = "10px";
    links.style.fontSize = "12px";

    if (lead.website) {
      const a = document.createElement("a");
      a.href = lead.website;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "Site";
      a.style.textDecoration = "underline";
      links.appendChild(a);
    }

    if (lead.instagram) {
      const a = document.createElement("a");
      a.href = lead.instagram.startsWith("http") ? lead.instagram : `https://instagram.com/${lead.instagram.replace("@", "")}`;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "Instagram";
      a.style.textDecoration = "underline";
      links.appendChild(a);
    }

    content.appendChild(title);
    content.appendChild(meta);
    if (lead.address) content.appendChild(addr);
    if (links.childNodes.length) content.appendChild(links);

    popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: false, offset: 16 })
      .setLngLat([lead.lng, lead.lat])
      .setDOMContent(content)
      .addTo(map);
  }

  function flyToLead(lead: LeadMapItem) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lead.lng, lead.lat], zoom: Math.max(map.getZoom(), 13), duration: 600 });
  }

  const selectedLead = useMemo(() => {
    if (!selectedId) return null;
    return leads.find((l) => l._id === selectedId) || null;
  }, [selectedId, leads]);

  async function updateStatus(id: string, next: LeadStatus) {
    // usando seu CRUDController padrão em /api/lead/[[...id]]
    const res = await fetch(`/api/lead/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qualificationStatus: next,
        qualificationNotes: next === "qualified" ? "Qualificado via mapa." : "",
      }),
    });

    if (!res.ok) return;

    // refetch para atualizar cores/pinos
    await fetchLeads();
  }

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "grid", gridTemplateColumns: "420px 1fr" }}>
      {/* LEFT: list */}
      <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 16, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Leads no Mapa</div>
          <button
            onClick={() => fetchLeads()}
            style={{
              fontSize: 12,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Atualizar
          </button>
        </div>

        {/* filters */}
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, endereço, insta..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            />
            <input
              value={stateUF}
              onChange={(e) => setStateUF(e.target.value)}
              placeholder="UF"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {(["all", "pending", "qualified", "unqualified"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  fontSize: 12,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: status === s ? "rgba(255,255,255,0.10)" : "transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {s === "all" ? "Todos" : statusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.8 }}>
          {loading ? "Carregando..." : `${leads.length} lead(s) com localização`}
        </div>

        {/* list */}
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {leads.map((lead) => {
            const active = lead._id === selectedId;
            return (
              <button
                key={lead._id}
                onClick={() => {
                  setSelectedId(lead._id);
                  flyToLead(lead);
                  openPopup(lead);
                }}
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 16,
                  border: `1px solid ${active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}`,
                  background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{lead.name}</div>
                  <div
                    title={statusLabel(lead.qualificationStatus)}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: statusPinColor(lead.qualificationStatus),
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                </div>

                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  {lead.city || "-"}
                  {lead.state ? `/${lead.state}` : ""}
                  {lead.address ? ` • ${lead.address}` : ""}
                </div>

                {active && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(lead._id, "qualified");
                      }}
                      style={{
                        fontSize: 12,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Qualificar
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(lead._id, "unqualified");
                      }}
                      style={{
                        fontSize: 12,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Desqualificar
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: map */}
      <div style={{ position: "relative" }}>
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />

        {/* mini overlay card */}
        {selectedLead && (
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              padding: 12,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(10px)",
              maxWidth: 420,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: statusPinColor(selectedLead.qualificationStatus) }} />
              <div style={{ fontWeight: 800, fontSize: 14 }}>{selectedLead.name}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{statusLabel(selectedLead.qualificationStatus)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
              {selectedLead.city || "-"}
              {selectedLead.state ? `/${selectedLead.state}` : ""}
              {selectedLead.address ? ` • ${selectedLead.address}` : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
