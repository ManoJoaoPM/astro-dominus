"use client";

import React from "react";

function extractDriveFolderId(url?: string | null) {
  if (!url) return null;

  // Ex: https://drive.google.com/drive/folders/<ID>
  const m1 = url.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];

  // Ex: https://drive.google.com/open?id=<ID>
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];

  // Ex: https://drive.google.com/embeddedfolderview?id=<ID>#grid
  const m3 = url.match(/embeddedfolderview\?id=([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];

  return null;
}

export function GoogleDriveFolderGrid({
  contentFolderUrl,
  height = 340,
}: {
  contentFolderUrl?: string | null;
  height?: number;
}) {
  const folderId = extractDriveFolderId(contentFolderUrl);

  if (!folderId) return null;

  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;

  return (
    <div className="rounded-md overflow-hidden border bg-white">
      <iframe
        title="Arquivos do Google Drive"
        src={embedUrl}
        width="100%"
        height={height}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
