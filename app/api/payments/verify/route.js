// app/api/payments/verify/route.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, student_id, amount } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing razorpay fields" }), { status: 400 });
    }
    if (!student_id) return new Response(JSON.stringify({ error: "Missing student_id" }), { status: 400 });
    if (amount === undefined || amount === null || amount === "") return new Response(JSON.stringify({ error: "Missing amount" }), { status: 400 });

    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_SECRET) {
      console.error("Razorpay secret not configured");
      return new Response(JSON.stringify({ error: "Razorpay secret not configured" }), { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("Signature mismatch", { generated_signature, razorpay_signature });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase server config missing");
      return new Response(JSON.stringify({ error: "Supabase server config missing" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing, error: existErr } = await supabase
      .from("payments")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .limit(1)
      .maybeSingle();
    if (existErr) {
      console.error("Supabase existing check error:", existErr);
      return new Response(JSON.stringify({ error: "db error" }), { status: 500 });
    }
    if (existing && existing.id) {
      return new Response(JSON.stringify({ ok: true, message: "already recorded" }), { status: 200 });
    }

    const insertObj = {
      student_id: Number(student_id),
      method: "Razorpay",
      amount: Number(parseFloat(amount)),
      status: "Paid",
      date: new Date().toISOString().slice(0, 10),
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    const { data: inserted, error: insertErr } = await supabase.from("payments").insert([insertObj]).select().single();
    if (insertErr) {
      console.error("Supabase insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to insert payment", details: insertErr }), { status: 500 });
    }

    const { error: updateErr } = await supabase.from("student_list").update({ payment: "Razorpay", status: "Paid" }).eq("id", Number(student_id));
    if (updateErr) console.warn("Student update failed (non-blocking):", updateErr);

    console.log("Payment recorded:", { id: inserted.id, razorpay_payment_id });
    return new Response(JSON.stringify({ ok: true, payment: inserted }), { status: 200 });
  } catch (err) {
    console.error("verify error:", err);
    return new Response(JSON.stringify({ error: "verify - server error", details: String(err.message || err) }), { status: 500 });
  }
}
