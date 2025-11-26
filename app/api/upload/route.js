import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // upload into assets bucket
    const fileName = `uploads/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("assests")             // <--- use your assets bucket name
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ message: "Upload failed", detail: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("assests").getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Server error", detail: String(e) }, { status: 500 });
  }
}
