export interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  account_status: number;
}

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  reach: string;
  frequency: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
}

export class MetaAdsApi {
  private accessToken: string;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.append("access_token", this.accessToken);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.error) {
      throw new Error(json.error.message || "Meta API Error");
    }

    return json;
  }

  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const res = await this.fetch<{ data: MetaAdAccount[] }>("/me/adaccounts", {
      fields: "name,account_id,currency,account_status",
      limit: 100,
    });
    return res.data;
  }

  async getInsights(adAccountId: string, since: string, until: string): Promise<MetaInsight[]> {
    // Request insights at 'account' level with daily breakdown
    const res = await this.fetch<{ data: MetaInsight[] }>(`/${adAccountId}/insights`, {
      level: "account", 
      time_increment: 1, 
      time_range: JSON.stringify({ since, until }),
      fields: "spend,impressions,clicks,reach,frequency,account_id,account_name",
      limit: 500,
    });
    
    return res.data;
  }
}
