"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractDriveFileId(url: string) {
  const s = url.trim();
  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  const m3 = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];
  return null;
}

function extractQueryParam(url: string, key: string) {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  const s = url
    .trim()
    .replace(/^["'`]+/, "")
    .replace(/["'`]+$/, "")
    .replace(/&amp;/g, "&");
  if (!s) return null;
  if (s.includes("drive.usercontent.google.com")) return s;
  if (s.includes("drive.google.com") || s.includes("googleusercontent.com") || s.includes("docs.google.com")) {
    const id = extractDriveFileId(s);
    if (id) {
      const resourceKey = extractQueryParam(s, "resourcekey");
      return `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0${
        resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ""
      }`;
    }
  }
  return s;
}

export default function DebugImagePage() {
  const [value, setValue] = useState("");
  const [useProxy, setUseProxy] = useState(true);

  const normalized = useMemo(() => normalizeImageUrl(value), [value]);
  const src = useMemo(() => {
    if (!normalized) return null;
    if (!useProxy) return normalized;
    return `/api/media/image-proxy?url=${encodeURIComponent(normalized)}`;
  }, [normalized, useProxy]);

  return (
    <div className="p-8 space-y-4 max-w-3xl">
      <div className="space-y-1">
        <div className="text-xl font-semibold">Teste de Imagem</div>
        <div className="text-sm text-muted-foreground">
          Cole um link do Google Drive e verifique se carrega direto e via proxy.
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Cole aqui a URL (drive.google.com, drive.usercontent.google.com, ...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="button" variant={useProxy ? "default" : "outline"} onClick={() => setUseProxy(!useProxy)}>
          {useProxy ? "Proxy: ON" : "Proxy: OFF"}
        </Button>
      </div>

      <div className="text-xs break-all">
        <div className="font-medium">Normalizado</div>
        <div className="text-muted-foreground">{normalized || "—"}</div>
      </div>

      <div className="text-xs break-all">
        <div className="font-medium">SRC final</div>
        <div className="text-muted-foreground">{src || "—"}</div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-muted/20">
        {src ? (
          <img
            src={src}
            alt="Preview"
            className="w-full max-h-[70vh] object-contain bg-white"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="p-10 text-sm text-muted-foreground">Cole uma URL para testar.</div>
        )}
      </div>
    </div>
  );
}

