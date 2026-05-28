```js id="opmuhq"
const Razorpay = require("razorpay");

module.exports = async (req, res) => {

  // ALLOW ONLY POST
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {

    // DEBUG LOG
    console.log("BODY:", req.body);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: Number(req.body.amount) * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json(order);

  } catch (error) {

    console.log("RAZORPAY ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```
