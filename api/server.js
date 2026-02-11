const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug check (you can remove later)
console.log("Mongo URI:", process.env.MONGO_URI);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Order Schema
const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  product: String,
  address: String,
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

// Save Order API
app.post("/order", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ message: "Order saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

// Get All Orders API
app.get("/orders", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Start Server
app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port 5000")
);
