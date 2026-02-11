const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"));

const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  product: String,
  address: String
});

const Order = mongoose.model("Order", OrderSchema);

app.post("/order", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.send("Order saved");
});

app.get("/orders", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

app.listen(5000, () => console.log("Server running"));
