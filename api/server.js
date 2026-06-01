const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const { MONGO_URI, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PORT = 5000 } = process.env;

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Order Schema
const OrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  product: { type: String, required: true },
  address: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String, unique: true },
  paymentId: String,
  paymentStatus: { type: String, default: "pending" }, // pending, completed, failed
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

// ============================
// 1) CREATE ORDER (Frontend)
// ============================
app.post("/api/create-order", async (req, res) => {
  try {
    const { name, email, phone, product, address, amount } = req.body;

    // Validation
    if (!name || !email || !phone || !product || !address || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required (name, email, phone, product, address, amount)" 
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Amount must be a positive number (in paise)" 
      });
    }

    // Save order to DB first
    const order = new Order({
      name,
      email,
      phone,
      product,
      address,
      amount,
      paymentStatus: "pending"
    });

    await order.save();

    // Create Razorpay order
    const Razorpay = require("razorpay");
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount), // must be in paise
      currency: "INR",
      receipt: `order_${order._id.toString()}`
    });

    // Update order with Razorpay Order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to create order" 
    });
  }
});

// ============================
// 2) VERIFY PAYMENT
// ============================
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required payment fields" 
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ 
        success: false, 
        error: "Payment signature verification failed" 
      });
    }

    // Update order in DB
    const order = await Order.findByIdAndUpdate(
      dbOrderId,
      {
        paymentId: razorpay_payment_id,
        paymentStatus: "completed",
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found in database" 
      });
    }

    return res.json({
      success: true,
      message: "Payment verified and order saved successfully",
      order
    });
  } catch (error) {
    console.error("❌ Verify Payment Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Verification failed" 
    });
  }
});

// ============================
// 3) GET ALL ORDERS (Admin)
// ============================
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Get Orders Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch orders" 
    });
  }
});

// ============================
// 4) GET ORDER BY ID
// ============================
app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found" 
      });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error("❌ Get Order Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch order" 
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
