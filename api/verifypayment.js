const crypto = require("crypto");

module.exports = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_SECRET
      )
      .update(body.toString())
      .digest("hex");

    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (isAuthentic) {

      // SAVE ORDER TO DB HERE

      return res.status(200).json({
        success: true,
      });

    } else {

      return res.status(400).json({
        success: false,
      });
    }

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
};
