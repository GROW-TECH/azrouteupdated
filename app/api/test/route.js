import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("Students").select("*");

  if (error) {
    return Response.json({ success: false, error: error.message });
  }

  return Response.json({ success: true, data });
}
