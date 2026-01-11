import Stripe from "stripe";
import TryCatch from "../Middleware/TryCatch.js";
import { User } from "../Model/user.js";
import { Courses } from "../Model/Course.js";
import mongoose from "mongoose";

// Lazy-load Stripe after env is loaded
let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

export const createPaymentIntent = TryCatch(async (req, res) => {
  const { amount, currency = "usd", courseId } = req.body;
  const userId = req.user._id;

  console.log("💳 CREATE PAYMENT INTENT REQUEST:", {
    amount,
    amountType: typeof amount,
    amountAfterParse: parseFloat(amount),
    currency,
    courseId,
    userId,
  });

  // Validate inputs
  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    console.error("❌ Invalid amount:", { amount, parsedAmount });
    return res.status(400).json({ message: `Invalid amount: ${amount}` });
  }

  if (!courseId) {
    console.error("❌ Course ID missing");
    return res.status(400).json({ message: "Course ID required" });
  }

  // Validate courseId is valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    console.error("❌ Invalid course ID format:", courseId);
    return res.status(400).json({ message: "Invalid course ID format" });
  }

  // Validate course exists and get price
  const course = await Courses.findById(courseId);
  if (!course) {
    console.error("❌ Course not found:", courseId);
    return res.status(404).json({ message: "Course not found" });
  }

  console.log("✅ Course found:", { courseId: course._id, price: course.price, title: course.title });

  // Check if user already enrolled
  const user = await User.findById(userId);
  if (!user) {
    console.error("❌ User not found:", userId);
    return res.status(404).json({ message: "User not found" });
  }

  const alreadyEnrolled = user.enrolledCourses?.some(
    (e) => e.courseId.toString() === courseId
  );
  if (alreadyEnrolled) {
    console.error("❌ Already enrolled:", { userId, courseId });
    return res.status(400).json({ message: "Already enrolled in this course" });
  }

  // Validate Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY not configured");
    return res.status(500).json({ message: "Payment service not configured" });
  }

  // Create payment intent with course and user metadata
  const amountInCents = Math.round(parsedAmount * 100);
  console.log("💵 Amount conversion:", {
    originalAmount: amount,
    parsedAmount: parsedAmount,
    amountInCents: amountInCents,
  });

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountInCents, // Convert to cents
    currency,
    metadata: {
      courseId: courseId.toString(),
      userId: userId.toString(),
    },
  });

  console.log("✅ Payment intent created:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    amountInCents: amountInCents,
  });

  res.status(201).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

export const confirmPayment = TryCatch(async (req, res) => {
  const { paymentIntentId, courseId } = req.body;
  const userId = req.user._id;

  console.log("💳 CONFIRM PAYMENT REQUEST:", {
    paymentIntentId,
    courseId,
    userId,
  });

  // Validate inputs
  if (!paymentIntentId) {
    return res.status(400).json({ message: "Payment Intent ID required" });
  }

  if (!courseId) {
    return res.status(400).json({ message: "Course ID required" });
  }

  // Validate courseId format
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "Invalid course ID format" });
  }

  // Validate Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ message: "Payment service not configured" });
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    return res.status(404).json({ message: "Payment not found" });
  }

  console.log("💳 STRIPE PAYMENT INTENT:", {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
  });

  if (paymentIntent.status === "succeeded") {
    // Check if already enrolled
    const user = await User.findById(userId);
    const alreadyEnrolled = user.enrolledCourses?.some(
      (e) => e.courseId.toString() === courseId
    );

    if (alreadyEnrolled) {
      console.log("👤 User already enrolled:", { userId, courseId });
      return res.json({
        message: "Already enrolled in this course",
        enrolled: true,
      });
    }

    // Update user enrollment
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          enrolledCourses: {
            courseId,
            enrolledAt: new Date(),
            paymentStatus: "completed",
            transactionId: paymentIntentId,
            amount: paymentIntent.amount / 100,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ ENROLLMENT UPDATED:", {
      userId,
      courseId,
      enrolledCourses: updatedUser.enrolledCourses?.length,
    });

    // Also update subscription array (for backward compatibility)
    if (!user.subscription.includes(courseId)) {
      await User.findByIdAndUpdate(userId, {
        $push: { subscription: courseId },
      });
    }

    res.json({
      message: "Payment successful! Course enrolled.",
      enrolled: true,
    });
  } else {
    res.status(400).json({
      message: `Payment not completed. Status: ${paymentIntent.status}`,
      enrolled: false,
    });
  }
});

export const getPaymentHistory = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Populate course details with only needed fields
  const userWithDetails = await User.findById(userId).populate(
    "enrolledCourses.courseId",
    "title price"
  );

  res.json({
    enrollments: userWithDetails.enrolledCourses || [],
    total: (userWithDetails.enrolledCourses || []).length,
  });
});

export const handleStripeWebhook = TryCatch(async (req, res) => {
  // Webhook validation - requires raw body
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ message: "Missing Stripe signature" });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️  STRIPE_WEBHOOK_SECRET not configured - webhooks disabled");
    return res.status(500).json({ message: "Webhook not configured" });
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body, // Must be raw buffer, not JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle payment_intent.succeeded
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { courseId, userId } = paymentIntent.metadata;

    if (!courseId || !userId) {
      console.warn("Missing metadata in payment intent:", paymentIntent.id);
      return res.status(400).json({ message: "Invalid metadata" });
    }

    // Update database
    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          enrolledCourses: {
            courseId,
            paymentStatus: "completed",
            transactionId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
          },
        },
      });
      console.log(`✅ Enrollment recorded for user ${userId} on course ${courseId}`);
    } catch (err) {
      console.error("Failed to record enrollment:", err);
    }
  }

  // Handle payment_intent.payment_failed
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const { courseId, userId } = paymentIntent.metadata;

    if (courseId && userId) {
      try {
        // Log failed payment
        await User.findByIdAndUpdate(userId, {
          $push: {
            enrolledCourses: {
              courseId,
              paymentStatus: "failed",
              transactionId: paymentIntent.id,
            },
          },
        });
        console.log(`❌ Payment failed for user ${userId} on course ${courseId}`);
      } catch (err) {
        console.error("Failed to log payment failure:", err);
      }
    }
  }

  res.json({ received: true });
});
