import { Report } from "@/models/marketing/report/model";
import { ReportBlock } from "@/models/marketing/report-block/model";
import { MetricSnapshot } from "@/models/marketing/metric-snapshot/model";
import { NextResponse } from "next/server";
import { startConnection } from "@/lib/mongoose";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await startConnection();
  const { slug } = await params;

  // 1. Fetch Report
  const report = await Report.findOne({ slug, isPublic: true }).lean<any>();
  if (!report) {
    return NextResponse.json({ error: "Report not found or not public" }, { status: 404 });
  }

  // 2. Fetch Blocks
  const blocks = await ReportBlock.find({ reportId: report._id }).sort({ order: 1 }).lean();

  // 3. Fetch Data (MetricSnapshot)
  // Determine date range
  let startDate = report.dateRange?.startDate ? new Date(report.dateRange.startDate) : subDays(new Date(), 30);
  let endDate = report.dateRange?.endDate ? new Date(report.dateRange.endDate) : new Date();

  if (report.dateRange?.period === "today") {
    startDate = startOfDay(new Date());
    endDate = endOfDay(new Date());
  } else if (report.dateRange?.period === "last_7d") {
    startDate = subDays(new Date(), 7);
  } else if (report.dateRange?.period === "last_30d") {
    startDate = subDays(new Date(), 30);
  }

  // Collect all metrics needed
  const allMetrics = new Set<string>();
  blocks.forEach((b) => {
    b.config?.metricsSelected?.forEach((m: string) => allMetrics.add(m));
  });

  const snapshots = await MetricSnapshot.find({
    clientId: report.clientId,
    metricKey: { $in: Array.from(allMetrics) },
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 }).lean();

  return NextResponse.json({
    report: {
      ...report,
      computedDateRange: { startDate, endDate },
    },
    blocks,
    data: snapshots,
  });
}
