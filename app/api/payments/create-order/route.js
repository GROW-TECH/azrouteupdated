// app/api/payments/create-order/route.js
export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId, amount, currency = "INR", receipt = "" } = body || {};

    if (!studentId) return new Response(JSON.stringify({ error: "studentId is required" }), { status: 400 });
    if (amount === undefined || amount === null || amount === "") return new Response(JSON.stringify({ error: "amount is required" }), { status: 400 });

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay env missing");
      return new Response(JSON.stringify({ error: "Razorpay credentials not configured on server" }), { status: 500 });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return new Response(JSON.stringify({ error: "amount must be a positive number" }), { status: 400 });

    const amountInPaise = Math.round(parsedAmount * 100);

    const payload = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${studentId}_${Date.now()}`,
      payment_capture: 1,
      notes: { student_id: String(studentId) },
    };

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error("Razorpay order create error", { status: r.status, body: data });
      return new Response(JSON.stringify({ error: "Razorpay order creation failed", details: data || { status: r.status } }), { status: 500 });
    }

    return new Response(JSON.stringify({ order: data, key: RAZORPAY_KEY_ID }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-order error:", err);
    return new Response(JSON.stringify({ error: "create-order - server error", details: String(err.message || err) }), { status: 500 });
  }
}
