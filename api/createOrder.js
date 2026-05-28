// server.js (or routes file)
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Use env vars for keys
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, BASE_URL } = process.env;

// 1) Create order
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required (in paise)" });

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount,            // e.g. 79900 for ₹799.00
      currency,          // 'INR'
      receipt: receipt || `rcpt_${Date.now()}`
    });

    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// 2) Verify payment signature (called from frontend after success)
app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }
    const shasum = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
    const digest = shasum.digest("hex");
    const ok = digest === razorpay_signature;
    return res.json({ ok });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Verification error" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on ${port}`));
