import { ENV } from "@/env";
import axios from "axios";

const API_TOKEN = ENV.PIPEDRIVE_API_TOKEN;
// Remove protocol and .pipedrive.com if present, to ensure only subdomain is used
const COMPANY_DOMAIN = ENV.PIPEDRIVE_COMPANY_DOMAIN?.replace(/^https?:\/\//, "").replace(/\.pipedrive\.com.*$/, "");
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
    } catch (error: any) {
      console.error("Pipedrive Search Person Error:", error.response?.data || error.message);
      return null;
    }
  }

  static async searchOrganization(term: string) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const res = await this.client.get("/organizations/search", {
        params: { term, limit: 1 },
      });
      return res.data?.data?.items?.[0]?.item || null;
    } catch (error: any) {
      console.error("Pipedrive Search Organization Error:", error.response?.data || error.message);
      return null;
    }
  }

  static async getAllOrganizations(start = 0, limit = 500) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return [];
    try {
      const res = await this.client.get("/organizations", {
        params: { start, limit },
      });
      return res.data?.data || [];
    } catch (error: any) {
      console.error("Pipedrive Get All Organizations Error:", error.response?.data || error.message);
      return [];
    }
  }

  static async createOrganization(data: { name: string; address?: string; website?: string; custom_fields?: any }) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const payload: any = { name: data.name };
      if (data.address) payload.address = data.address;
      // Pipedrive often creates custom fields for things, but if 'website' is a key provided, try adding it to payload directly?
      // Or maybe it is a standard field? Pipedrive Organization standard fields usually don't include 'website' at root level in older API versions, 
      // but let's assume it works if passed or mapped correctly.
      // Wait, standard Pipedrive actually handles addresses, but websites might be custom or specific keys.
      // However, user explicitly said "Site: website", so I will use that key.
      if (data.website) payload.website = data.website;
      
      // Merge custom fields into payload
      if (data.custom_fields) {
        Object.assign(payload, data.custom_fields);
      }
      
      console.log(`[Pipedrive] Creating Organization. Payload:`, JSON.stringify(payload, null, 2));
      const res = await this.client.post("/organizations", payload);
      console.log(`[Pipedrive] Organization Created. ID: ${res.data?.data?.id}`, JSON.stringify(res.data, null, 2));
      return res.data?.data;
    } catch (error: any) {
      console.error("Pipedrive Create Organization Error:", error.response?.data || error.message);
      throw error;
    }
  }

  static async updateOrganization(id: number, data: { name?: string; address?: string; website?: string; custom_fields?: any }) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.address) payload.address = data.address;
      if (data.website) payload.website = data.website;

      // Merge custom fields into payload
      if (data.custom_fields) {
        Object.assign(payload, data.custom_fields);
      }
      
      // If payload is empty, nothing to update
      if (Object.keys(payload).length === 0) return null;

      console.log(`[Pipedrive] Updating Organization ${id}. Payload:`, JSON.stringify(payload, null, 2));
      const res = await this.client.put(`/organizations/${id}`, payload);
      console.log(`[Pipedrive] Organization Updated.`, JSON.stringify(res.data, null, 2));
      return res.data?.data;
    } catch (error: any) {
      console.error("Pipedrive Update Organization Error:", error.response?.data || error.message);
      throw error;
    }
  }

  static async createPerson(data: { name: string; email?: string; phone?: string; org_id?: number }) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const payload: any = { name: data.name };
      if (data.email) payload.email = [data.email];
      if (data.phone) payload.phone = [data.phone];
      if (data.org_id) payload.org_id = data.org_id;
      
      console.log(`[Pipedrive] Creating Person. Payload:`, JSON.stringify(payload, null, 2));
      const res = await this.client.post("/persons", payload);
      console.log(`[Pipedrive] Person Created. ID: ${res.data?.data?.id}`, JSON.stringify(res.data, null, 2));
      return res.data?.data;
    } catch (error: any) {
      console.error("Pipedrive Create Person Error:", error.response?.data || error.message);
      throw error;
    }
  }

  static async createDeal(title: string, personId?: number, orgId?: number, custom_fields?: any) {
    if (!API_TOKEN || !COMPANY_DOMAIN) return null;
    try {
      const payload: any = {
        title,
        status: "open",
      };
      if (personId) payload.person_id = personId;
      if (orgId) payload.org_id = orgId;
      
      // Merge custom fields into payload
      if (custom_fields) {
        Object.assign(payload, custom_fields);
      }
      
      console.log(`[Pipedrive] Creating Deal. Payload:`, JSON.stringify(payload, null, 2));
      const res = await this.client.post("/deals", payload);
      console.log(`[Pipedrive] Deal Created. ID: ${res.data?.data?.id}`, JSON.stringify(res.data, null, 2));
      return res.data?.data;
    } catch (error: any) {
      console.error("Pipedrive Create Deal Error:", error.response?.data || error.message);
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
    } catch (error: any) {
      console.error("Pipedrive Create Activity Error:", error.response?.data || error.message);
      throw error;
    }
  }
}
