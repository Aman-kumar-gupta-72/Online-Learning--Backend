import express from "express";

const router = express.Router();

// Simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "✅ Payment routes are accessible",
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
});

export default router;
