import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedUrl(url: URL) {
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  const allowed = new Set([
    "drive.usercontent.google.com",
    "drive.google.com",
    "lh3.googleusercontent.com",
  ]);
  if (allowed.has(host)) return true;
  if (host.endsWith(".googleusercontent.com")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowedUrl(target)) {
    return new Response("URL not allowed", { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return new Response(text || "Upstream error", { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const cacheControl =
    upstream.headers.get("cache-control") || "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}

