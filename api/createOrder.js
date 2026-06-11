const Razorpay = require("razorpay");

module.exports = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "API working"
  });
};