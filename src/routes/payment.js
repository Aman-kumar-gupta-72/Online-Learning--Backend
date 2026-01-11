import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleStripeWebhook,
} from "../Controller/payment.js";
import { isAuth } from "../Middleware/isAuth.js";

const router = express.Router();

// Create payment intent (authenticated)
router.post("/payment/create-intent", isAuth, createPaymentIntent);

// Confirm payment and enroll user (authenticated)
router.post("/payment/confirm", isAuth, confirmPayment);

// Get user's payment history (authenticated)
router.get("/payment/history", isAuth, getPaymentHistory);

// Stripe webhook (raw body required, no JSON parsing)
router.post("/payment/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
