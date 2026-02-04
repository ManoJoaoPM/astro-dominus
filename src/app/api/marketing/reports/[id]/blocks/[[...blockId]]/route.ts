import { ReportBlock, reportBlockSchema } from "@/models/marketing/report-block/model";
import { withSession } from "@/struct";
import { Types } from "mongoose";

// Helper to parse params
const getParams = async (params: any) => {
  const p = await params;
  const reportId = p.id;
  const blockId = p.blockId?.[0];
  return { reportId, blockId };
};

export const GET = withSession(
  async ({ user }, req, { params }) => {
    const { reportId, blockId } = await getParams(params);

    if (blockId) {
      const block = await ReportBlock.findOne({ _id: blockId, reportId });
      if (!block) return Response.json({ message: "Block not found" }, { status: 404 });
      return Response.json(block);
    }

    const blocks = await ReportBlock.find({ reportId }).sort({ order: 1 });
    return Response.json({ data: blocks });
  },
  { roles: ["admin", "operational", "commercial"] }
);

export const POST = withSession(
  async ({ user }, req, { params }) => {
    const { reportId } = await getParams(params);
    const body = await req.json();

    // Validate body
    const data = await reportBlockSchema.parseAsync({ ...body, reportId });

    // Auto-assign order if not provided
    if (data.order === undefined || data.order === 0) {
      const lastBlock = await ReportBlock.findOne({ reportId }).sort({ order: -1 });
      data.order = (lastBlock?.order || 0) + 1;
    }

    const block = await ReportBlock.create(data);
    return Response.json(block);
  },
  { roles: ["admin", "operational"] }
);

export const PATCH = withSession(
  async ({ user }, req, { params }) => {
    const { reportId, blockId } = await getParams(params);
    
    // Special case for reordering: PATCH /reports/:id/blocks with body { blocks: [{id, order}] }
    // Since blockId is optional [[...blockId]], if it's missing, we check for bulk update
    if (!blockId) {
      const body = await req.json();
      if (body.reorder && Array.isArray(body.blocks)) {
        // Bulk reorder
        const operations = body.blocks.map((b: { _id: string; order: number }) => ({
          updateOne: {
            filter: { _id: b._id, reportId },
            update: { $set: { order: b.order } },
          },
        }));
        if (operations.length > 0) {
          await ReportBlock.bulkWrite(operations);
        }
        return Response.json({ success: true });
      }
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const body = await req.json();
    const data = await reportBlockSchema.partial().parseAsync(body);

    const block = await ReportBlock.findOneAndUpdate(
      { _id: blockId, reportId },
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!block) return Response.json({ message: "Block not found" }, { status: 404 });
    return Response.json(block);
  },
  { roles: ["admin", "operational"] }
);

export const DELETE = withSession(
  async ({ user }, req, { params }) => {
    const { reportId, blockId } = await getParams(params);

    if (!blockId) return Response.json({ message: "Block ID required" }, { status: 400 });

    const result = await ReportBlock.deleteOne({ _id: blockId, reportId });
    
    if (result.deletedCount === 0) {
      return Response.json({ message: "Block not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  },
  { roles: ["admin", "operational"] }
);
