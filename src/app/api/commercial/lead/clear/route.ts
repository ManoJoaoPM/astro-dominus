import { NextResponse } from "next/server";
import { withSession } from "@/struct";
import { CommercialLead } from "@/models/commercial/lead/model";
import { startConnection } from "@/lib/mongoose";

export const GET = async () => {
  // if (user?.role !== "admin") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // }
  
  await startConnection();
  await CommercialLead.deleteMany({});
  
  return NextResponse.json({ success: true, message: "Todos os leads foram removidos." });
};

export const DELETE = async () => {
  // if (user?.role !== "admin") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // }
  
  await startConnection();
  await CommercialLead.deleteMany({});
  
  return NextResponse.json({ success: true, message: "Todos os leads foram removidos." });
};
