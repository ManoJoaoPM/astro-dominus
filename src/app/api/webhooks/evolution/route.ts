import { NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { Conversation } from "@/models/whatsapp/conversation/model";
import { Message } from "@/models/whatsapp/message/model";
import { IntelligenceAnalyzer, TriggerService } from "@/services/intelligence/analyzer";
import { startConnection } from "@/lib/mongoose";

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

          if (!conversation) {
            conversation = await Conversation.create({
              instanceId: dbInstance._id,
              remoteJid,
              contactName: msg.pushName || remoteJid.split("@")[0],
              source: "Não identificado",
              unreadCount: 0,
              firstContactAt: lastMessageAt,
              lastMessageAt,
              lastMessageContent: content,
              lastMessagePreview: content.slice(0, 100),
            });
          }

          // Analyze Message (Optional/Intelligence)
          const analysis = IntelligenceAnalyzer.analyze(content);

          // Media Meta
          let mediaMeta = undefined;
          if (msg.messageType !== "text") {
            const media = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage;
            if (media) {
              mediaMeta = {
                mimetype: media.mimetype,
                filename: media.fileName,
                filesize: media.fileLength,
              };
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
            messageType: msg.messageType || "text",
            content,
            timestamp,
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
