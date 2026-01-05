import { ENV } from "@/env";
import axios from "axios";

const API_TOKEN = ENV.PIPEDRIVE_API_TOKEN;
const COMPANY_DOMAIN = ENV.PIPEDRIVE_COMPANY_DOMAIN;
const BASE_URL = `https://${COMPANY_DOMAIN}.pipedrive.com/api/v1`;

export class PipedriveService {
  private static get client() {
    return axios.create({
      baseURL: BASE_URL,
      params: { api_token: API_TOKEN },
    });
  }

  static async searchPerson(term: string) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const res = await this.client.get("/persons/search", {
        params: { term, limit: 1 },
      });
      return res.data?.data?.items?.[0]?.item || null;
    } catch (error) {
      console.error("Pipedrive Search Error:", error);
      return null;
    }
  }

  static async createPerson(data: { name: string; email?: string; phone?: string }) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const payload: any = { name: data.name };
      if (data.email) payload.email = [data.email];
      if (data.phone) payload.phone = [data.phone];

      const res = await this.client.post("/persons", payload);
      return res.data?.data;
    } catch (error) {
      console.error("Pipedrive Create Person Error:", error);
      throw error;
    }
  }

  static async createDeal(personId: number, title: string) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const res = await this.client.post("/deals", {
        title,
        person_id: personId,
        status: "open", 
        // stage_id: 1 // Default to first stage
      });
      return res.data?.data;
    } catch (error) {
      console.error("Pipedrive Create Deal Error:", error);
      throw error;
    }
  }

  static async createActivity(dealId: number, subject: string) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const res = await this.client.post("/activities", {
        subject,
        deal_id: dealId,
        type: "call", // or 'email', 'task'
        due_date: new Date().toISOString().split("T")[0],
      });
      return res.data?.data;
    } catch (error) {
      console.error("Pipedrive Create Activity Error:", error);
      throw error;
    }
  }
}
