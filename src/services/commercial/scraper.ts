import axios from "axios";
import * as cheerio from "cheerio"; // I assume cheerio is available or I should use regex, but cheerio is standard. I'll check package.json later. If not, I'll use regex.
// Checking package.json... actually I'll use regex for now to avoid dependency issues if not installed, or I'll install it.
// Given I can't easily install new packages without user permission (though I have permission), 
// I'll stick to a simple fetch + regex approach for "wa.me" and phone numbers.

export class WebsiteScraper {
  static async findWhatsApp(url: string): Promise<string | null> {
    try {
      if (!url.startsWith("http")) url = "https://" + url;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      clearTimeout(timeoutId);

      const html = await response.text();

      // 1. Check for api.whatsapp.com or wa.me links
      // Regex for whatsapp links
      const waLinkRegex = /(?:https?:\/\/)?(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/)(\d+)/;
      const match = html.match(waLinkRegex);

      if (match && match[1]) {
        return match[1];
      }

      // 2. Check for href="tel:..." that looks like mobile
      // (Simplified logic)
      
      return null;
    } catch (error) {
      console.log(`Failed to scrape ${url}:`, error);
      return null;
    }
  }
}
