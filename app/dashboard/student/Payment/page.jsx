// app/dashboard/student/payments/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

/**
 * PaymentPage with due-deadline enforcement:
 * - Shows due (prefers payment-level then student-level)
 * - Format due as DD-MM-YYYY
 * - If due exists and is past (today > due) and student NOT Paid -> block payment and show Access blocked
 */

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summaryStatus, setSummaryStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment modal state (will be disabled if Paid or locked)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);

  const studentChannelRef = useRef(null);
  const paymentsChannelRef = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/student/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const email = session?.user?.email;
        if (!email) throw new Error("No email present in session");

        // include student due fields
        const { data: studentRow, error: studentErr } = await supabase
          .from("student_list")
          .select("id, reg_no, name, email, course, payment, status, fees, phone, due_date, due_note")
          .eq("email", email)
          .single();

        if (studentErr) throw studentErr;
        setStudent(studentRow || null);

        if (studentRow) {
          await refreshPayments(studentRow.id, studentRow);
        } else {
          setPayments([]);
          setSummaryStatus("Pending");
        }
      } catch (err) {
        console.error("Failed to load payments:", err);
        setError(err.message || "Failed to load payments");
        setStudent(null);
        setPayments([]);
        setSummaryStatus("Pending");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, status]);

  async function refreshPayments(studentId, currentStudent = null) {
    try {
      const { data: paymentRows, error: paymentsErr } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (paymentsErr) {
        console.error("Failed to fetch payments:", paymentsErr);
        setPayments([]);
        setSummaryStatus((currentStudent && currentStudent.status) ? currentStudent.status : "Pending");
        return;
      }

      setPayments(paymentRows || []);

      if (currentStudent && currentStudent.status) {
        setSummaryStatus(currentStudent.status);
        return;
      }

      const hasPaid = Array.isArray(paymentRows) && paymentRows.some(p => p.status && p.status.toLowerCase() === "paid");
      setSummaryStatus(hasPaid ? "Paid" : "Pending");
    } catch (err) {
      console.error("refreshPayments error:", err);
      setPayments([]);
      setSummaryStatus((currentStudent && currentStudent.status) ? currentStudent.status : "Pending");
    }
  }

  useEffect(() => {
    if (!student?.id) return;
    // keep realtime subscription code if you use it
  }, [student?.id]);

  const openPayModal = () => {
    if (!student) return alert("Student record not found.");
    if (summaryStatus === "Paid") return;
    if (isLocked()) {
      alert("Payment is blocked — due deadline passed. Contact admin.");
      return;
    }
    const defaultAmount = student.fees != null ? Number(student.fees).toFixed(2) : "";
    setPayAmount(defaultAmount);
    setPayMethod(student.payment || "UPI");
    setShowPayModal(true);
  };

  // helper to format method text for display
  const formatMethod = (method) => {
    if (!method) return "—";
    const key = String(method).trim().toLowerCase();
    if (key === "razorpay" || key === "online" || key === "gateway") return "Online";
    if (key.includes("upi")) return "UPI";
    if (key.includes("card")) return "Card";
    if (key.includes("net") || key.includes("netbank")) return "Net Banking";
    if (key.includes("cash")) return "Cash";
    return String(method).charAt(0).toUpperCase() + String(method).slice(1);
  };

  // format YYYY-MM-DD or Date -> DD-MM-YYYY
  const formatDateDDMMYYYY = (d) => {
    if (!d) return null;
    const dt = typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? new Date(d) : new Date(d);
    if (isNaN(dt.getTime())) return null;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // compare date strings (YYYY-MM-DD or Date) with today (local date)
  const isDatePast = (d) => {
    if (!d) return false;
    // normalize to date-only for comparison
    const target = new Date(d);
    if (isNaN(target.getTime())) return false;
    // strip time -> use local date
    const tY = target.getFullYear();
    const tM = target.getMonth();
    const tD = target.getDate();
    const targetOnly = new Date(tY, tM, tD);

    const now = new Date();
    const nY = now.getFullYear();
    const nM = now.getMonth();
    const nD = now.getDate();
    const todayOnly = new Date(nY, nM, nD);

    return todayOnly.getTime() > targetOnly.getTime(); // true if today > target (past)
  };

  // determine the due to use (prefer latest payment then student-level)
  const latest = payments?.[0] || null;
  const paymentDueRaw = latest?.due_date || null;
  const studentDueRaw = student?.due_date || null;
  const dueToUseRaw = paymentDueRaw || studentDueRaw || null;
  const dueToShow = dueToUseRaw ? formatDateDDMMYYYY(dueToUseRaw) : null;
  const paymentNoteToShow = latest?.note || student?.due_note || null;

  // if due exists and is past and student not paid -> locked
  const isLocked = () => {
    // if already paid -> not locked
    if (String(summaryStatus || "").toLowerCase() === "paid") return false;
    const dueRaw = paymentDueRaw || studentDueRaw || null;
    if (!dueRaw) return false;
    return isDatePast(dueRaw);
  };

  // helper: show a styled due element (red if past)
  const DueDisplay = ({ dueRaw, note }) => {
    if (!dueRaw) return <span>—</span>;
    const formatted = formatDateDDMMYYYY(dueRaw);
    const past = isDatePast(dueRaw);
    return (
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>Due Deadline:</strong>
          <span style={{ color: past ? "#b91c1c" : undefined, fontWeight: 600 }}>{formatted}</span>
          {past && <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>Overdue</span>}
        </div>
        {note && <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>{note}</div>}
      </div>
    );
  };

  // helper: load Razorpay SDK
  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      try {
        if (typeof window === "undefined") return reject(new Error("Window is undefined"));
        if (window.Razorpay) return resolve(true);

        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) {
          const t = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(t);
              resolve(true);
            }
          }, 50);
          setTimeout(() => {
            if (!window.Razorpay) {
              clearInterval(t);
              reject(new Error("Razorpay SDK did not become available"));
            }
          }, 5000);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          if (window.Razorpay) resolve(true);
          else reject(new Error("Razorpay loaded but window.Razorpay is missing"));
        };
        script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
        document.body.appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Payment submit with lock check
  const submitPayment = async (e) => {
    e.preventDefault();
    if (!student) return alert("Student record not found.");
    if (summaryStatus === "Paid") return alert("This student is already marked as Paid.");
    if (isLocked()) return alert("Payment is blocked — due deadline passed. Contact admin.");

    const amount = parseFloat(String(payAmount).replace(/,/g, "").trim());
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

    setProcessing(true);

    try {
      const createRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, amount }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        console.error("create-order response error:", createJson);
        throw new Error(createJson.error || "Order creation failed on server");
      }

      const order = createJson.order;
      const key = createJson.key;
      if (!order) throw new Error("Server did not return Razorpay order. Contact support.");
      if (!key) throw new Error("Payment key missing from server response. Contact support.");

      await loadRazorpayScript();

      const amountPaise = order.amount != null ? Number(order.amount) : Math.round(amount * 100);

      const options = {
        key: String(key),
        amount: amountPaise,
        currency: order.currency || "INR",
        name: "Azroute Chess Institute",
        description: student.course || "Course fee",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                student_id: student.id,
                amount, // rupees
              }),
            });

            const verifyJson = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              console.error("Verification failed:", verifyJson);
              alert("Payment succeeded in gateway but verification failed. Contact support.");
              return;
            }

            await refreshPayments(student.id);
            const { data: refreshedStudent } = await supabase
              .from("student_list")
              .select("id, reg_no, name, email, course, payment, status, fees, due_date, due_note")
              .eq("id", student.id)
              .single();
            if (refreshedStudent) setStudent(refreshedStudent);

            setShowPayModal(false);
            alert("Payment successful and recorded.");
          } catch (err) {
            console.error("Post-payment verify error:", err);
            alert("Error verifying payment. See console for details.");
          }
        },
        prefill: {
          name: student.name,
          email: student.email,
          contact: student.phone || "",
        },
        notes: {
          student_id: String(student.id),
        },
        theme: { color: "#2563eb" },
      };

      let rzp;
      try {
        rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          console.error("Razorpay payment.failed", resp);
          alert("Payment failed or cancelled. If you were charged, contact support with the payment id.");
        });
        rzp.open();
      } catch (err) {
        console.error("Failed to open Razorpay checkout:", err);
        setTimeout(() => {
          try {
            if (rzp && typeof rzp.open === "function") {
              rzp.open();
            } else if (window.Razorpay) {
              const fallback = new window.Razorpay(options);
              fallback.on("payment.failed", (resp) => {
                console.error("Razorpay payment.failed", resp);
                alert("Payment failed or cancelled.");
              });
              fallback.open();
            } else {
              alert("Unable to open payment window. Please allow popups for this site and try again.");
            }
          } catch (err2) {
            console.error("Fallback open failed:", err2);
            alert("Unable to open the payment popup. Please allow popups and try again.");
          }
        }, 50);
      }
    } catch (err) {
      console.error("Payment flow failed:", err);
      alert("Payment flow failed: " + (err.message || "Unknown error") + ". Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  if (status === "loading" || loading) return <p className="p-6">Loading...</p>;
  if (error) return <div className="p-6"><p className="text-red-600">Error: {error}</p></div>;
  if (!student) return <div className="p-6"><h1 className="text-2xl font-bold">Payments</h1><p className="text-muted-foreground">No student record found.</p></div>;

  // NEAT display for "Paid" students: show only payment history
  if (summaryStatus === "Paid") {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Student: <strong>{student.name}</strong> — Course: <strong>{student.course || "—"}</strong>
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
                <p className="text-sm text-muted-foreground">Showing all recorded payments</p>
              </div>
              <Badge variant="default" className="bg-emerald-600 text-white">Paid</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Highlight latest payment */}
            {latest && (
              <div className="p-4 border-b flex items-center justify-between bg-emerald-50">
                <div>
                  <div className="text-sm text-muted-foreground">Latest payment</div>
                  <div className="mt-1 font-medium text-lg">₹{Number(latest.amount).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatMethod(latest.method)} • {latest.date}
                  </div>
                  {/* show due if exists */}
                  {dueToShow && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <strong>Due Deadline:</strong> {dueToShow}
                      {paymentNoteToShow ? ` — ${paymentNoteToShow}` : ""}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-sm">Paid</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compact history table (no notes column) */}
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Mode</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Due (if any)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const pDue = p.due_date ? formatDateDDMMYYYY(p.due_date) : (student.due_date ? formatDateDDMMYYYY(student.due_date) : "—");
                      return (
                        <tr key={p.id} className="border-t">
                          <td className="py-3 pr-4">{p.date}</td>
                          <td className="py-3 pr-4">₹{Number(p.amount).toFixed(2)}</td>
                          <td className="py-3 pr-4">{formatMethod(p.method)}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded text-xs ${p.status && p.status.toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {p.status || "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">{pDue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default view when Pending (original behavior + modal)
  const amountDisplay = latest ? `₹${Number(latest.amount).toFixed(2)}` : "—";
  const methodDisplay = latest ? formatMethod(latest.method) : "—";
  const dateDisplay = latest?.date || "—";
  const locked = isLocked();

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Student: <strong>{student.name}</strong> — Course: <strong>{student.course || "—"}</strong></p>
      </div>

      <div className="grid gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">{student.course || "Course"}</CardTitle>
              <Badge variant={summaryStatus === "Paid" ? "default" : "destructive"}>{summaryStatus}</Badge>
            </div>
          </CardHeader>

          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>Student:</strong> {student.name} (Reg: {student.reg_no})</p>
            <p><strong>Assigned Fees:</strong> {student.fees != null ? `₹${Number(student.fees).toFixed(2)}` : "—"}</p>
            <p><strong>Latest Payment Amount:</strong> {amountDisplay}</p>
            <p><strong>Latest Payment Method:</strong> {methodDisplay}</p>
            <p><strong>Latest Payment Date:</strong> {dateDisplay}</p>

            {/* show due deadline (prefer payment-level, else student-level) */}
            <div>
              <DueDisplay dueRaw={dueToUseRaw} note={paymentNoteToShow} />
            </div>

            {locked && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: "#fff1f2", color: "#b91c1c" }}>
                <strong>Access blocked for your course:</strong> The due deadline has passed. Access to the course and payments are blocked. Contact admin.
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <Button
                className="mt-3 bg-[#3b82f6] hover:bg-[#2563eb]"
                onClick={openPayModal}
                disabled={summaryStatus === "Paid" || locked}
              >
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {payments?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Payment History</h2>
            <div className="grid gap-4 mt-2">
              {payments.map((p) => (
                <Card key={p.id} className="border">
                  <CardContent className="text-sm text-muted-foreground flex justify-between items-center">
                    <div>
                      <div><strong>Amount:</strong> ₹{Number(p.amount).toFixed(2)}</div>
                      <div><strong>Method:</strong> {formatMethod(p.method)}</div>
                      <div><strong>Status:</strong> {p.status}</div>
                      <div><strong>Due:</strong> {p.due_date ? formatDateDDMMYYYY(p.due_date) : (student.due_date ? formatDateDDMMYYYY(student.due_date) : '—')}</div>
                    </div>
                    <div className="text-right">{p.date}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* modal (only possible when not paid and not locked) */}
      {showPayModal && summaryStatus !== "Paid" && !locked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Make Payment</h3>
            <form onSubmit={submitPayment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border px-3 py-2 rounded"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Defaulted from assigned fees if available.</p>
              </div>

              <div>
                <label className="block text-sm font-medium">Payment Method</label>
                <select
                  className="mt-1 block w-full border px-3 py-2 rounded"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded border hover:bg-gray-50"
                  onClick={() => setShowPayModal(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Proceed to Razorpay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
