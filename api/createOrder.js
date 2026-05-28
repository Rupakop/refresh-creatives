const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {

    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json(order);

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};
