import { NextResponse } from "next/server";
import { withSession } from "@/struct";
import { put, del } from "@vercel/blob";
import { ENV } from "@/env";

export const POST = withSession(async (_, req) => {
  console.log("Received file upload request");
  const form = await req.formData();
  const file = form.get("file") as File;
  const folder = form.get("folder")?.toString() || "";

  if (!file || !(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  console.log("File received:", file.name, "Size:", file.size, "Type:", file.type);
  const ext = file.name.split(".").pop();
  const randomName = `${crypto.randomUUID()}.${ext}`;
  const filePath = folder ? `${folder}/${randomName}` : randomName;

  console.log("Uploading file to blob storage");
  const blob = await put(filePath, await file.arrayBuffer(), {
    access: "public",
    token: ENV.BLOB_READ_WRITE_TOKEN,
  });

  console.log("File uploaded successfully:", blob.url);
  return NextResponse.json({ url: blob.url });
});

export const DELETE = withSession(async (_, req) => {
  try {
    const { url } = await req.json();
    await del([url], { token: ENV.BLOB_READ_WRITE_TOKEN });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
});
