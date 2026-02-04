import { MarketingIntegration } from "@/models/marketing/integration/model";
import { MarketingDailyFact } from "@/models/marketing/daily-fact/model";
import { MetricSnapshot } from "@/models/marketing/metric-snapshot/model";
import { MetaAdsApi } from "@/services/meta/api";
import { withSession } from "@/struct";
import { subDays, format } from "date-fns";

export const POST = withSession(
  async ({ user }, req: Request) => {
    try {
      const body = await req.json();
      const { integrationId } = body;

      if (!integrationId) {
        return Response.json({ error: "integrationId is required" }, { status: 400 });
      }

      const integration = await MarketingIntegration.findById(integrationId);
      if (!integration) {
        return Response.json({ error: "Integration not found" }, { status: 404 });
      }

      if (integration.provider !== "meta") {
        return Response.json({ error: "Only Meta provider is supported for now" }, { status: 400 });
      }

      if (!integration.accessToken || !integration.adAccountId) {
        return Response.json({ error: "Integration missing credentials" }, { status: 400 });
      }

      // Fetch from Meta
      const api = new MetaAdsApi(integration.accessToken);
      
      const today = new Date();
      // Sync last 30 days to capture late attribution updates
      const since = format(subDays(today, 30), "yyyy-MM-dd");
      const until = format(today, "yyyy-MM-dd");
      
      const insights = await api.getInsights(integration.adAccountId, since, until);

      // 1. Upsert Legacy Facts (MarketingDailyFact)
      const factOperations = insights.map((insight) => ({
        updateOne: {
          filter: {
            integrationId: integration._id,
            date: insight.date_start,
          },
          update: {
            $set: {
              spend: parseFloat(insight.spend || "0"),
              impressions: parseInt(insight.impressions || "0"),
              clicks: parseInt(insight.clicks || "0"),
              reach: parseInt(insight.reach || "0"),
              frequency: parseFloat(insight.frequency || "0"),
              campaignId: null,
              campaignName: null,
              adsetId: null,
              adsetName: null,
              adId: null,
              adName: null,
            },
          },
          upsert: true,
        },
      }));

      if (factOperations.length > 0) {
        await MarketingDailyFact.bulkWrite(factOperations);
      }

      // 2. Upsert Metric Snapshots (New System)
      const snapshotOperations: any[] = [];
      
      insights.forEach((insight) => {
        const date = new Date(insight.date_start);
        const metrics = [
          { key: "spend", value: parseFloat(insight.spend || "0") },
          { key: "impressions", value: parseInt(insight.impressions || "0") },
          { key: "clicks", value: parseInt(insight.clicks || "0") },
          { key: "reach", value: parseInt(insight.reach || "0") },
          { key: "frequency", value: parseFloat(insight.frequency || "0") },
        ];

        metrics.forEach((m) => {
          snapshotOperations.push({
            updateOne: {
              filter: {
                clientId: integration.clientId,
                provider: "meta_ads",
                metricKey: m.key,
                date: date,
              },
              update: {
                $set: {
                  value: m.value,
                  dimensions: {
                    adAccountId: integration.adAccountId,
                  }
                }
              },
              upsert: true,
            }
          });
        });
      });

      if (snapshotOperations.length > 0) {
        await MetricSnapshot.bulkWrite(snapshotOperations);
      }

      // Update Integration
      integration.lastSyncAt = new Date();
      integration.status = "active";
      integration.errorMessage = null;
      await integration.save();

      return Response.json({ 
        success: true, 
        count: factOperations.length,
        snapshots: snapshotOperations.length,
        message: `Synced ${factOperations.length} days` 
      });

    } catch (error: any) {
      console.error("Sync Error:", error);
      return Response.json(
        { error: error.message || "Sync failed" },
        { status: 500 }
      );
    }
  },
  {
    roles: ["admin", "operational", "commercial"],
  }
);
