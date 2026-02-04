import { EvolutionApi } from "../evolution/api";
import { Conversation } from "@/models/whatsapp/conversation/model";
import { Message } from "@/models/whatsapp/message/model";
import { IntelligenceAnalyzer } from "../intelligence/analyzer";

const evolution = new EvolutionApi();

export class WhatsAppSyncService {
  /**
   * Performs a comprehensive sync of recent chats and messages for an instance.
   * This is intended to be run when an instance is connected or manually refreshed.
   */
  static async fullSync(dbInstance: any) {
    try {
      
      // 1. Fetch Chats
      const chats = await evolution.fetchChats(dbInstance.instanceName);
      
      if (!Array.isArray(chats)) {
        return;
      }

      // Determine limit: If no conversations exist (initial sync), pull only 10. Otherwise, pull 50.
      const existingCount = await Conversation.countDocuments({ instanceId: dbInstance._id });
      const isInitialSync = existingCount === 0;
      const chatLimit = isInitialSync ? 10 : 50;

      // Process top chats
      const topChats = chats.slice(0, chatLimit);

      for (const chat of topChats) {
        const remoteJid = chat.id || chat.remoteJid;
        
        // Strict Validation
        if (!remoteJid || typeof remoteJid !== 'string') {
          continue;
        }

        const normalizedRemoteJid = remoteJid.trim();
        if (!normalizedRemoteJid.endsWith("@s.whatsapp.net") && !normalizedRemoteJid.endsWith("@c.us")) {
          continue;
        }
        
        // Filter out groups and broadcasts
        if (normalizedRemoteJid.includes("@g.us") || normalizedRemoteJid === "status@broadcast") {
          continue;
        }

        // 2. Fetch Profile Picture (Optional, can be skipped if performance is critical)
        const profilePicUrl = await evolution.fetchProfilePictureUrl(dbInstance.instanceName, normalizedRemoteJid);

        // 3. Upsert Conversation
        let conversation = await Conversation.findOne({ 
          instanceId: dbInstance._id, 
          remoteJid: normalizedRemoteJid 
        });

        // Try to extract last message from chat object if available
        const lastMessageAt = chat.conversationTimestamp 
          ? new Date(Number(chat.conversationTimestamp) * 1000) 
          : new Date();
          
        let content = "Sincronizado"; 

        if (!conversation) {
          conversation = await Conversation.create({
            instanceId: dbInstance._id,
            remoteJid: normalizedRemoteJid,
            contactName: chat.pushName || chat.name || normalizedRemoteJid.split("@")[0],
            profilePicUrl,
            source: "Não identificado",
            unreadCount: chat.unreadCount || 0,
            firstContactAt: lastMessageAt,
            lastMessageAt,
            lastMessageContent: content,
            lastMessagePreview: content,
          });
        } else {
          conversation.profilePicUrl = profilePicUrl || conversation.profilePicUrl;
          conversation.contactName = chat.pushName || chat.name || conversation.contactName;
          conversation.unreadCount = chat.unreadCount || conversation.unreadCount;
          await conversation.save();
        }

        // 4. Fetch Messages ONLY if it's the initial sync
        // This satisfies "As mensagens devem ser as primeiros 20 mensagens trocadas" for new installs
        // And avoids "varios queries" for routine updates.
        if (isInitialSync) {
            const messages = await evolution.fetchMessages(dbInstance.instanceName, normalizedRemoteJid, 20);
            
            if (Array.isArray(messages) && messages.length > 0) {
                // Update content from latest fetched message
                const latestMsg = messages[0];
                content = this.extractContent(latestMsg);

                for (const msg of messages) {
                    const evolutionId = msg.key?.id || msg.id;
                    if (!evolutionId) continue;
          
                    const exists = await Message.exists({ evolutionId });
                    if (exists) continue;
          
                    const msgContent = this.extractContent(msg);
                    const analysis = IntelligenceAnalyzer.analyze(msgContent);
          
                    let mediaMeta = undefined;
                    if (msg.messageType && msg.messageType !== "conversation" && msg.messageType !== "extendedTextMessage") {
                       const media = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage;
                       if (media) {
                         let size = media.fileLength || media.filesize;
                         if (size && typeof size === 'object' && 'low' in size) {
                           size = size.low;
                         }
          
                         mediaMeta = {
                           mimetype: media.mimetype,
                           filename: media.fileName,
                           filesize: Number(size),
                         };
                       }
                    }
          
                    await Message.create({
                      conversationId: conversation._id,
                      instanceId: dbInstance._id,
                      evolutionId,
                      key: msg.key || { remoteJid: normalizedRemoteJid, fromMe: msg.fromMe, id: evolutionId },
                      direction: (msg.key?.fromMe || msg.fromMe) ? "outbound" : "inbound",
                      messageType: msg.messageType || "text",
                      content: msgContent,
                      timestamp: msg.messageTimestamp || msg.timestamp,
                      mediaMeta,
                      analysis,
                    });
                }

                // Update conversation with real content
                conversation.lastMessageContent = content;
                conversation.lastMessagePreview = content.slice(0, 100);
                await conversation.save();
            }
        }
      }

    } catch (error: any) {
       // Silent error handling
    }
  }

  /**
   * Lightweight sync for periodic updates or on refresh.
   */
  static async syncRecent(dbInstance: any) {
    try {
      const chats = await evolution.fetchChats(dbInstance.instanceName);
      if (!Array.isArray(chats)) return;

      const topChats = chats.slice(0, 20);

      for (const chat of topChats) {
        const remoteJid = chat.id || chat.remoteJid;
        if (!remoteJid || typeof remoteJid !== "string") continue;
        const normalizedRemoteJid = remoteJid.trim();
        if (!normalizedRemoteJid.endsWith("@s.whatsapp.net") && !normalizedRemoteJid.endsWith("@c.us")) continue

        const isGroup =
          normalizedRemoteJid.includes("@g.us") ||
          Boolean(chat.isGroup || chat.isGroupChat || chat.groupMetadata || chat.participants);
        const isBroadcast =
          normalizedRemoteJid === "status@broadcast" || Boolean(chat.isBroadcast || chat.isBroadcastChat);
        if (isGroup || isBroadcast) continue;

        let conversation = await Conversation.findOne({
          instanceId: dbInstance._id,
          remoteJid: normalizedRemoteJid,
        });

        const rawChatTimestamp = Number(
          chat.conversationTimestamp ?? chat.timestamp ?? chat.lastMessageTimestamp ?? chat.lastMessageAt
        );
        let chatTimestamp = Number.isFinite(rawChatTimestamp) ? rawChatTimestamp : undefined;
        if (chatTimestamp && chatTimestamp > 100000000000) chatTimestamp = Math.floor(chatTimestamp / 1000);
        const chatLastAt = chatTimestamp ? new Date(chatTimestamp * 1000) : new Date();

        if (!conversation) {
          const profilePicUrl = await evolution.fetchProfilePictureUrl(dbInstance.instanceName, normalizedRemoteJid);
          conversation = await Conversation.create({
            instanceId: dbInstance._id,
            remoteJid: normalizedRemoteJid,
            contactName: chat.pushName || chat.name || normalizedRemoteJid.split("@")[0],
            profilePicUrl,
            source: "Não identificado",
            unreadCount: chat.unreadCount || 0,
            firstContactAt: chatLastAt,
            lastMessageAt: chatLastAt,
            lastMessageContent: "",
            lastMessagePreview: "",
          });
        } else {
          const profilePicUrl = await evolution.fetchProfilePictureUrl(dbInstance.instanceName, normalizedRemoteJid);
          conversation.profilePicUrl = profilePicUrl || conversation.profilePicUrl;
          conversation.contactName = chat.pushName || chat.name || conversation.contactName;
          conversation.unreadCount = chat.unreadCount || conversation.unreadCount;
          await conversation.save();
        }

        if (chatTimestamp && conversation.lastMessageAt && conversation.lastMessageAt.getTime() >= chatLastAt.getTime()) {
          continue;
        }

        const messages = await evolution.fetchMessages(dbInstance.instanceName, normalizedRemoteJid, 10);
        if (!Array.isArray(messages) || messages.length === 0) continue;

        for (const msg of messages) {
          const evolutionId = msg.key?.id || msg.id;
          if (!evolutionId) continue;

          const exists = await Message.exists({ evolutionId });
          if (exists) continue;

          const msgContent = this.extractContent(msg);
          const analysis = IntelligenceAnalyzer.analyze(msgContent);

          const fromMe = Boolean(msg.key?.fromMe ?? msg.fromMe);
          const key = msg.key || { remoteJid: normalizedRemoteJid, fromMe, id: evolutionId };

          let timestamp = Number(msg.messageTimestamp ?? msg.timestamp);
          if (!Number.isFinite(timestamp)) {
            timestamp = Math.floor(Date.now() / 1000);
          } else if (timestamp > 100000000000) {
            timestamp = Math.floor(timestamp / 1000);
          }

          let mediaMeta = undefined;
          if (msg.messageType && msg.messageType !== "conversation" && msg.messageType !== "extendedTextMessage") {
            const media =
              msg.message?.imageMessage ||
              msg.message?.videoMessage ||
              msg.message?.audioMessage ||
              msg.message?.documentMessage;
            if (media) {
              let size = media.fileLength || media.filesize;
              if (size && typeof size === "object" && "low" in size) {
                size = size.low;
              }

              mediaMeta = {
                mimetype: media.mimetype,
                filename: media.fileName,
                filesize: Number(size),
              };
            }
          }

          await Message.create({
            conversationId: conversation._id,
            instanceId: dbInstance._id,
            evolutionId,
            key,
            direction: fromMe ? "outbound" : "inbound",
            messageType: msg.messageType || "text",
            content: msgContent,
            timestamp,
            mediaMeta,
            analysis,
          });
        }

        const latestMsg = messages[0];
        const latestContent = this.extractContent(latestMsg);
        let latestTimestamp = Number(latestMsg.messageTimestamp ?? latestMsg.timestamp);
        if (!Number.isFinite(latestTimestamp)) {
          latestTimestamp = chatTimestamp ?? Math.floor(Date.now() / 1000);
        } else if (latestTimestamp > 100000000000) {
          latestTimestamp = Math.floor(latestTimestamp / 1000);
        }

        conversation.lastMessageContent = latestContent;
        conversation.lastMessagePreview = latestContent.slice(0, 100);
        conversation.lastMessageAt = new Date(latestTimestamp * 1000);
        await conversation.save();
      }
    } catch {
      return;
    }
  }

  private static extractContent(msg: any): string {
    if (typeof msg === 'string') return msg;
    
    const message = msg.message || msg;
    
    return message.conversation || 
           message.extendedTextMessage?.text || 
           message.imageMessage?.caption || 
           message.videoMessage?.caption || 
           message.text ||
           msg.content || 
           "";
  }
}
