import { ENV } from "@/env";
import axios from "axios";

// Using Live endpoint for MVP speed, but normally should use Task Post/Get
// Docs: https://docs.dataforseo.com/v3/google/maps/live/advanced/
const BASE_URL = "https://api.dataforseo.com/v3";

export class DataForSEO {
  private static getAuth() {
    const login = ENV.DATAFORSEO_LOGIN;
    const password = ENV.DATAFORSEO_PASSWORD;
    return Buffer.from(`${login}:${password}`).toString("base64");
  }

  static async fetchMapsData(keyword: string, location: string) {
    try {
      const auth = this.getAuth();
      const payload = [
        {
          keyword: `${keyword} in ${location}`,
          location_code: 2076, // Brazil country code, but usually better to let "in City" handle it or use specific location_code
          language_code: "pt",
          depth: 100, // Max results
        },
      ];

      const response = await axios.post(
        `${BASE_URL}/google/maps/live/advanced`,
        payload,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      const tasks = response.data?.tasks;
      if (!tasks || tasks.length === 0) return [];

      const result = tasks[0].result;
      if (!result || result.length === 0) return [];

      return result[0].items || [];
    } catch (error) {
      console.error("DataForSEO Error:", error);
      throw new Error("Failed to fetch data from DataForSEO");
    }
  }
}
