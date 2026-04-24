import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("picture") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filePath = path.join(process.cwd(), "public", file.name);
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ success: true, data: {url: `/${file.name}`} });
}