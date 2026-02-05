import { NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { Conversation } from "@/models/whatsapp/conversation/model";
import { Message } from "@/models/whatsapp/message/model";
import { IntelligenceAnalyzer, TriggerService } from "@/services/intelligence/analyzer";
import { startConnection } from "@/lib/mongoose";
import { EvolutionApi } from "@/services/evolution/api";
import { put } from "@vercel/blob";
import { ENV } from "@/env";

function extractMetaAdsAttribution(input: any) {
  const seen = new WeakSet<object>();
  const stack: any[] = [input];

  let ctwaClid: string | undefined;
  let showAdAttribution: boolean | undefined;
  let sourceType: string | undefined;
  let sourceId: string | undefined;

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (typeof (node as any).ctwaClid === "string" && (node as any).ctwaClid.trim()) ctwaClid = (node as any).ctwaClid.trim();
    if (typeof (node as any).ctwa_clid === "string" && (node as any).ctwa_clid.trim()) ctwaClid = (node as any).ctwa_clid.trim();
    if (typeof (node as any).showAdAttribution === "boolean") showAdAttribution = (node as any).showAdAttribution;
    if (typeof (node as any).sourceType === "string") sourceType = (node as any).sourceType;
    if (typeof (node as any).sourceId === "string") sourceId = (node as any).sourceId;

    const externalAdReply = (node as any).externalAdReply;
    if (externalAdReply && typeof externalAdReply === "object") {
      stack.push(externalAdReply);
    }

    for (const value of Object.values(node as any)) {
      if (value && typeof value === "object") stack.push(value);
    }
  }

  const isMetaAds = Boolean(ctwaClid) || showAdAttribution === true || sourceType === "ad";
  return { isMetaAds, ctwaClid, showAdAttribution, sourceType, sourceId };
}

// This webhook handles ALL events from Evolution API
export async function POST(req: Request) {
  try {
    await startConnection();
    const body = await req.json();
    const rawEvent = body?.event ?? body?.data?.event ?? body?.type ?? body?.eventName;
    const normalizedEvent = String(rawEvent || "").toUpperCase().replace(/\./g, "_");

    const rawInstance =
      body?.instanceName ??
      body?.instance ??
      body?.instance?.instanceName ??
      body?.instance?.name ??
      body?.data?.instanceName ??
      body?.data?.instance;

    const instanceName = typeof rawInstance === "string" ? rawInstance : undefined;
    const data = body?.data ?? body?.payload ?? body;

    if (!normalizedEvent || !instanceName) return NextResponse.json({ status: "ok" });

    // 1. Find Instance
    const dbInstance = await WhatsAppInstance.findOne({ instanceName });
    if (!dbInstance) {
      return NextResponse.json({ status: "ignored" });
    }

    // Update last activity
    dbInstance.lastActivityAt = new Date();
    dbInstance.lastWebhookAt = new Date();
    dbInstance.lastWebhookEvent = normalizedEvent;
    dbInstance.lastWebhookError = undefined;

    // 2. Handle Events
    switch (normalizedEvent) {
      case "QRCODE_UPDATED":
        dbInstance.status = "connecting";
        dbInstance.qrCode = data.qrcode?.base64;
        dbInstance.logs?.push({
          event: "QRCODE_UPDATED",
          timestamp: new Date(),
        });
        await dbInstance.save();
        break;

      case "CONNECTION_UPDATE":
        const status = data.statusReason; // e.g., open, close, connecting
        if (status === "open") {
          dbInstance.status = "connected";
          dbInstance.qrCode = undefined; // Clear QR code on connection
        } else if (status === "close" || status === "refused") {
          dbInstance.status = "disconnected";
        }
        dbInstance.logs?.push({
          event: "CONNECTION_UPDATE",
          timestamp: new Date(),
          details: data,
        });
        await dbInstance.save();
        break;

      case "MESSAGES_UPDATE":
        const updates = Array.isArray(data)
          ? data
          : (data?.messages?.records ?? data?.messages ?? data?.records ?? data?.record ?? [data]);
        for (const update of updates) {
          const evolutionId = update.key?.id;
          if (!evolutionId) continue;

          // Evolution API message update format varies, but usually contains 'update' field
          // We can update the status (read/delivered) or the content if edited
          await Message.findOneAndUpdate(
            { evolutionId },
            { 
              $set: { 
                status: update.status,
                // If it's an edit, the content might be in update.message
                ...(update.message ? { content: update.message.conversation || update.message.extendedTextMessage?.text } : {})
              } 
            }
          );
        }
        break;

      case "MESSAGES_DELETE":
        const deletion = data?.key ? data : (data?.messages?.records?.[0] ?? data?.messages?.[0] ?? data?.records?.[0] ?? data?.record?.[0] ?? data);
        const deleteId = deletion.key?.id;
        if (deleteId) {
          await Message.deleteOne({ evolutionId: deleteId });
        }
        break;

      case "MESSAGES_UPSERT":
      case "SEND_MESSAGE":
        const messages = Array.isArray(data)
          ? data
          : (data?.messages?.records ?? data?.messages ?? data?.records ?? data?.record ?? [data]);
        
        for (const msg of messages) {
          const candidateRemoteJid =
            msg.key?.remoteJid ||
            msg.remoteJid ||
            msg.to ||
            msg.chatId ||
            msg.sender?.remoteJid ||
            msg.sender?.jid;
          
          // STRICT FILTERING
          if (!candidateRemoteJid || typeof candidateRemoteJid !== "string") continue;
          const remoteJid = candidateRemoteJid.trim();
          if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@c.us")) continue;
          if (remoteJid === "status@broadcast" || remoteJid.includes("@g.us")) continue;

          // Check if message already exists (idempotency)
          const evolutionId = msg.key?.id || msg.id;
          if (!evolutionId) continue;

          const exists = await Message.exists({ evolutionId });
          if (exists) {
            continue;
          }

          // Upsert Conversation (Thread)
          let conversation = await Conversation.findOne({ 
            instanceId: dbInstance._id, 
            remoteJid 
          });

          const content = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || 
                          msg.message?.imageMessage?.caption || 
                          msg.message?.videoMessage?.caption || 
                          "";

          let timestamp = Number(msg.messageTimestamp ?? msg.timestamp);
          if (!Number.isFinite(timestamp)) {
            timestamp = Math.floor(Date.now() / 1000);
          } else if (timestamp > 100000000000) {
            timestamp = Math.floor(timestamp / 1000);
          }
          const lastMessageAt = new Date(timestamp * 1000);
          const attribution = extractMetaAdsAttribution(msg);

          if (!conversation) {
            conversation = await Conversation.create({
              instanceId: dbInstance._id,
              remoteJid,
              contactName: msg.pushName || remoteJid.split("@")[0],
              source: attribution.isMetaAds ? "Meta Ads" : "Não identificado",
              metaAdsCtwaClid: attribution.ctwaClid,
              metaAdsSourceId: attribution.sourceId,
              metaAdsShowAdAttribution: attribution.showAdAttribution,
              unreadCount: 0,
              firstContactAt: lastMessageAt,
              lastMessageAt,
              lastMessageContent: content,
              lastMessagePreview: content.slice(0, 100),
            });
          } else {
            if (conversation.source === "Não identificado" && attribution.isMetaAds) {
              conversation.source = "Meta Ads";
            }
            if (attribution.ctwaClid && !conversation.metaAdsCtwaClid) {
              conversation.metaAdsCtwaClid = attribution.ctwaClid;
            }
            if (attribution.sourceId && !conversation.metaAdsSourceId) {
              conversation.metaAdsSourceId = attribution.sourceId;
            }
            if (typeof attribution.showAdAttribution === "boolean" && typeof conversation.metaAdsShowAdAttribution !== "boolean") {
              conversation.metaAdsShowAdAttribution = attribution.showAdAttribution;
            }
          }

          // Analyze Message (Optional/Intelligence)
          const analysis = IntelligenceAnalyzer.analyze(content);

          const detectType = (m: any) => {
            if (m?.message?.audioMessage) return "audio";
            if (m?.message?.imageMessage) return "image";
            if (m?.message?.videoMessage) return "video";
            if (m?.message?.documentMessage) return "document";
            if (m?.message?.conversation || m?.message?.extendedTextMessage?.text) return "text";
            const raw = String(m?.messageType || "").toLowerCase();
            if (raw.includes("audio")) return "audio";
            if (raw.includes("image")) return "image";
            if (raw.includes("video")) return "video";
            if (raw.includes("document")) return "document";
            if (raw.includes("text")) return "text";
            return "other";
          };

          const messageType = detectType(msg);

          // Media Meta
          let mediaMeta = undefined;
          if (messageType !== "text") {
            const media = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage;
            if (media) {
              mediaMeta = {
                mimetype: media.mimetype,
                filename: media.fileName,
                filesize: media.fileLength,
              };
            }
          }

          let mediaUrl: string | undefined = undefined;
          if (messageType === "audio" && ENV.BLOB_READ_WRITE_TOKEN) {
            const toExt = (mimetype?: string) => {
              const mt = String(mimetype || "").toLowerCase();
              if (mt.includes("audio/ogg")) return "ogg";
              if (mt.includes("audio/opus")) return "opus";
              if (mt.includes("audio/mpeg")) return "mp3";
              if (mt.includes("audio/mp4")) return "m4a";
              if (mt.includes("audio/webm")) return "webm";
              return "ogg";
            };

            const parseDataUrl = (input: any) => {
              if (!input) return { base64: null as string | null, mimetype: undefined as string | undefined };
              const s = String(input).trim();
              const match = s.match(/^data:([^;]+);base64,(.*)$/);
              if (match) {
                return { mimetype: match[1], base64: match[2].trim() };
              }
              return { base64: s, mimetype: undefined };
            };

            try {
              const evolution = new EvolutionApi();
              const base64Res: any = await evolution.getBase64FromMediaMessage(instanceName, msg);
              const candidate = base64Res?.base64 ?? base64Res?.data ?? base64Res;
              const parsed = parseDataUrl(candidate);
              const finalMime = parsed.mimetype || mediaMeta?.mimetype || "audio/ogg";
              const rawBase64 = parsed.base64?.replace(/\s/g, "");

              if (rawBase64) {
                const buffer = Buffer.from(rawBase64, "base64");
                const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                const ext = toExt(finalMime);
                const filename = `${evolutionId}.${ext}`;
                const blobPath = `whatsapp/${instanceName}/audio/${filename}`;
                const blob = await put(blobPath, arrayBuffer, {
                  access: "public",
                  token: ENV.BLOB_READ_WRITE_TOKEN,
                  contentType: finalMime,
                });
                mediaUrl = blob.url;
                mediaMeta = {
                  ...(mediaMeta || {}),
                  mimetype: finalMime,
                  filename: (mediaMeta as any)?.filename || filename,
                  url: blob.url,
                };
              }
            } catch {
              // ignore
            }
          }

          // Save Message
          const fromMe = Boolean(msg.key?.fromMe ?? msg.fromMe);
          const key = msg.key || { remoteJid, fromMe, id: evolutionId };
          const newMessage = await Message.create({
            conversationId: conversation._id,
            instanceId: dbInstance._id,
            evolutionId,
            key,
            direction: fromMe ? "outbound" : "inbound",
            messageType,
            content,
            timestamp,
            mediaUrl,
            mediaMeta,
            analysis,
          });

          // Update Conversation Summary
          conversation.lastMessageContent = content;
          conversation.lastMessagePreview = content.slice(0, 100);
          conversation.lastMessageAt = lastMessageAt;
          if (!fromMe) {
            conversation.unreadCount += 1;
          }
          await conversation.save();
          
          // Process Triggers
          await TriggerService.processTriggers(newMessage, conversation);
        }
        
        await dbInstance.save(); // Save lastActivityAt
        break;
    }

    return NextResponse.json({ status: "processed" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
