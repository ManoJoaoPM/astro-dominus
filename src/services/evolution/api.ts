import axios from "axios";
import { ENV } from "@/env";

export class EvolutionApi {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const configuredUrl = ENV.EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const configuredKey = ENV.EVOLUTION_API_KEY || ENV.EVOLUTION_APIKEY || process.env.EVOLUTION_API_KEY || process.env.EVOLUTION_APIKEY;

    if (!configuredUrl) {
      if ((ENV.NODE_ENV || process.env.NODE_ENV) === "development") {
        this.baseUrl = "http://localhost:8080";
      } else {
        throw new Error("EVOLUTION_API_URL não configurada. Em produção, a API da Evolution não pode ser 'localhost'.");
      }
    } else {
      this.baseUrl = configuredUrl;
    }

    this.baseUrl = this.normalizeUrl(this.baseUrl);
    this.apiKey = configuredKey || "";
  }

  private normalizeUrl(input: string) {
    const trimmed = String(input || "").trim().replace(/^['"`\s]+|['"`\s]+$/g, "");
    return trimmed.replace(/\/$/, "");
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
    };
  }

  // Generic request helpers
  private buildError(method: string, path: string, error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const statusLabel = status ? `status=${status}` : "status=unknown";
    const dataLabel = data ? ` response=${JSON.stringify(data).slice(0, 400)}` : "";
    return new Error(`[EvolutionApi] ${method} ${this.baseUrl}${path} falhou (${statusLabel}). Verifique EVOLUTION_API_URL/EVOLUTION_API_KEY.${dataLabel}`);
  }

  private async get(path: string, opts?: { allow404?: boolean }) {
    try {
      const response = await axios.get(`${this.baseUrl}${path}`, { headers: this.headers });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 && opts?.allow404) {
        return null;
      }
      throw this.buildError("GET", path, error);
    }
  }

  private async post(path: string, payload: any) {
    try {
      const response = await axios.post(`${this.baseUrl}${path}`, payload, { headers: this.headers });
      return response.data;
    } catch (error: any) {
      throw this.buildError("POST", path, error);
    }
  }

  private async delete(path: string) {
    try {
      const response = await axios.delete(`${this.baseUrl}${path}`, { headers: this.headers });
      return response.data;
    } catch (error: any) {
      throw this.buildError("DELETE", path, error);
    }
  }

  // 1. Instance Management
  async createInstance(instanceName: string, webhookUrl?: string) {
    const payload: any = {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    };
    const data = await this.post("/instance/create", payload);
    if (!data) {
      throw new Error("[EvolutionApi] Resposta vazia ao criar instância. Verifique EVOLUTION_API_URL/EVOLUTION_API_KEY.");
    }
    
    if (webhookUrl) {
      await this.setWebhook(instanceName, webhookUrl);
    }
    
    return data;
  }

  async connectInstance(instanceName: string) {
    return this.get(`/instance/connect/${instanceName}`);
  }

  async getConnectionState(instanceName: string) {
    const candidates = [
      `/instance/connectionState/${instanceName}`,
      `/instance/connection-state/${instanceName}`,
      `/instance/connectionstate/${instanceName}`,
    ];

    for (const path of candidates) {
      try {
        const res = await this.get(path, { allow404: true });
        if (res) return res;
      } catch {
        // ignore
      }
    }

    try {
      const instances = await this.fetchInstances();
      const list = Array.isArray(instances) ? instances : instances?.instances;
      if (Array.isArray(list)) {
        const match = list.find((i: any) => i?.instanceName === instanceName || i?.name === instanceName);
        if (match) {
          const state = match?.state || match?.instance?.state || match?.connectionState || match?.status;
          return { instance: { state } };
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  async fetchInstances() {
    try {
      const data = await this.get("/instance/fetchInstances");
      return data ?? [];
    } catch {
      return [];
    }
  }

  async restartInstance(instanceName: string) {
    return this.post(`/instance/restart/${instanceName}`, {});
  }

  async logoutInstance(instanceName: string) {
    return this.delete(`/instance/logout/${instanceName}`);
  }

  async deleteInstance(instanceName: string) {
    return this.delete(`/instance/delete/${instanceName}`);
  }

  // 2. Webhook
  async setWebhook(instanceName: string, webhookUrl: string) {
    const payload = {
      url: webhookUrl,
      enabled: true,
      webhook_by_events: true,
      events: [
        "QRCODE_UPDATED",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE",
      ]
    };
    return this.post(`/webhook/set/${instanceName}`, payload);
  }

  async findWebhook(instanceName: string) {
    return this.get(`/webhook/find/${instanceName}`, { allow404: true });
  }

  // 3. Chat & Messages
  async fetchChats(instanceName: string) {
    try {
      const data = await this.post(`/chat/findChats/${instanceName}`, {});
      
      let chats = [];
      if (Array.isArray(data)) {
        chats = data;
      } else if (data?.records && Array.isArray(data.records)) {
        chats = data.records;
      } else if (data?.chats && Array.isArray(data.chats)) {
        chats = data.chats;
      }

      return chats;
    } catch (error: any) {
      return [];
    }
  }

  async fetchMessages(instanceName: string, remoteJid: string, limit = 20) {
    const payload = {
      where: { remoteJid },
      limit: limit
    };
    try {
      const data = await this.post(`/chat/findMessages/${instanceName}`, payload);
      
      // Support multiple response formats: data.messages.records, data.record, or data (array)
      let messages = [];
      if (data?.messages?.records && Array.isArray(data.messages.records)) {
        messages = data.messages.records;
      } else if (data?.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      } else if (data?.records && Array.isArray(data.records)) {
        messages = data.records;
      } else if (data?.record && Array.isArray(data.record)) {
        messages = data.record;
      } else if (Array.isArray(data)) {
        messages = data;
      }

      return messages;
    } catch (error: any) {
      return [];
    }
  }

  // 4. Enrichment
  async findContacts(instanceName: string) {
    return this.post(`/chat/findContacts/${instanceName}`, {});
  }

  async fetchProfilePictureUrl(instanceName: string, remoteJid: string) {
    try {
      const data = await this.post(`/chat/fetchProfilePictureUrl/${instanceName}`, { number: remoteJid });
      return data?.profilePictureUrl || data?.url || null;
    } catch {
      return null;
    }
  }

  async checkWhatsAppNumbers(instanceName: string, numbers: string[]) {
    return this.post(`/chat/whatsappNumbers/${instanceName}`, { numbers });
  }

  async getBase64FromMediaMessage(instanceName: string, message: any) {
    return this.post(`/chat/getBase64FromMediaMessage/${instanceName}`, { message });
  }
}
