import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertCourseSchema, insertAdminUserSchema, insertSubscriptionSchema, insertUserProfileSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import { randomUUID } from "crypto";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import Stripe from "stripe";

// WaafiPay Integration - Supports both demo and production modes
const processWaafiPayment = async (paymentData: {
  phone: string;
  amount: number;
  paymentMethod: string;
  courseId: string;
}) => {
  const hasApiKeys = !!(process.env.WAAFI_MERCHANT_UID && process.env.WAAFI_API_USER_ID && process.env.WAAFI_API_KEY);
  const demoMode = process.env.DEMO_MODE !== 'false' || !hasApiKeys;
  
  if (demoMode) {
    console.log(`🔄 Demo Mode: Processing ${paymentData.paymentMethod.toUpperCase()} payment for ${paymentData.phone}`);
    
    // Simulate realistic payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate different outcomes based on phone number for testing
    const lastDigit = parseInt(paymentData.phone.slice(-1));
    
    if (lastDigit === 0) {
      return {
        success: false,
        message: `${paymentData.paymentMethod.toUpperCase()} payment failed - Insufficient funds (Demo Mode)`
      };
    }
    
    return {
      success: true,
      transactionId: `DEMO_TXN_${Date.now()}_${paymentData.paymentMethod.toUpperCase()}`,
      message: `✅ ${paymentData.paymentMethod.toUpperCase()} payment successful - $${paymentData.amount} (Demo Mode)`
    };
  }

  // Production mode - Real WaafiPay integration
  try {
    console.log(`💳 Production: Processing real ${paymentData.paymentMethod.toUpperCase()} payment for ${paymentData.phone}`);
    
    const { payByWaafiPay } = require('evc-plus');
    
    const response = await payByWaafiPay({
      phone: paymentData.phone,
      amount: paymentData.amount,
      merchantUid: process.env.WAAFI_MERCHANT_UID,
      apiUserId: process.env.WAAFI_API_USER_ID,
      apiKey: process.env.WAAFI_API_KEY,
      description: `CourseHub - ${paymentData.courseId}`,
      invoiceId: `CH_${Date.now()}`,
      referenceId: `${paymentData.courseId}_${Date.now()}`,
    });

    const isSuccess = response.responseCode === "2001" || response.responseCode === 2001;
    
    return {
      success: isSuccess,
      transactionId: response.transactionId || `TXN_${Date.now()}`,
      message: isSuccess ? 
        `✅ ${paymentData.paymentMethod.toUpperCase()} payment successful - $${paymentData.amount}` : 
        `❌ Payment failed: ${response.responseMsg || 'Unknown error'}`
    };
  } catch (error: any) {
    console.error('WaafiPay payment error:', error);
    return {
      success: false,
      message: `Payment processing failed: ${error.message || 'Network error'}`
    };
  }
};

// Initialize Stripe (will work once API keys are provided)
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.log("⚠️ Stripe API key not found - card payments will be disabled");
  }
} catch (error) {
  console.error("❌ Stripe initialization failed:", error);
}

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware with PostgreSQL store for production
  const PgStore = connectPgSimple(session);
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'coursehub-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  // Use PostgreSQL session store in production
  if (isProduction && process.env.DATABASE_URL) {
    sessionConfig.store = new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  app.use(session(sessionConfig));
  // Get all courses
  // Health check endpoint for deployment monitoring
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "CourseHub API" 
    });
  });

  // Get public configuration
  app.get("/api/config", (req, res) => {
    res.json({
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        enabled: !!process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  });

  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get single course
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Create payment
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Validate course exists
      const course = await storage.getCourse(paymentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Create payment record
      const payment = await storage.createPayment(paymentData);

      // Process payment with WaafiPay
      const paymentResult = await processWaafiPayment({
        phone: paymentData.phone,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        courseId: paymentData.courseId
      });

      // Update payment status
      const updatedPayment = await storage.updatePaymentStatus(
        payment.id,
        paymentResult.success ? "completed" : "failed",
        paymentResult.transactionId
      );

      res.json({
        payment: updatedPayment,
        success: paymentResult.success,
        message: paymentResult.message
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error('Payment error:', error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Get payment status
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Stripe payment intent creation
  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Card payments not available. Stripe API key not configured." 
        });
      }

      const { courseId, amount, currency = "usd", customerName, customerEmail } = req.body;

      // Validate course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Create payment record first
      const paymentData = {
        courseId,
        phone: customerEmail || `card_${Date.now()}`, // Use email or generate identifier for card payments
        amount: amount.toString(),
        paymentMethod: "card",
        status: "pending" as const
      };

      const payment = await storage.createPayment(paymentData);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          courseId,
          paymentId: payment.id,
          customerName: customerName || "Anonymous",
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } catch (error: any) {
      console.error("Stripe payment intent creation failed:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent: " + error.message 
      });
    }
  });

  // Stripe webhook (for production)
  app.post("/api/payments/stripe-webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.log("⚠️ Stripe webhook secret not configured");
        return res.status(400).json({ message: "Webhook secret not configured" });
      }

      if (!sig || typeof sig !== 'string') {
        return res.status(400).json({ message: "Missing or invalid signature" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: "Invalid signature" });
      }

      // Handle successful payment
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata.paymentId;
        
        if (paymentId) {
          await storage.updatePaymentStatus(
            paymentId,
            "completed",
            paymentIntent.id
          );
          console.log(`✅ Card payment completed: ${paymentId}`);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Premium subscription endpoints
  
  // Create Stripe Checkout session for premium subscription
  app.post("/api/subscriptions/create-checkout", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Premium subscriptions not available. Stripe not configured." 
        });
      }

      const { userId, plan, customerEmail, returnUrl } = req.body;

      if (!userId || !plan || !customerEmail) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, plan, customerEmail" 
        });
      }

      // Define subscription plans
      const plans = {
        premium: {
          priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_placeholder',
          amount: 2999, // $29.99 per month
          name: 'Premium Plan'
        }
      };

      if (!plans[plan as keyof typeof plans]) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const selectedPlan = plans[plan as keyof typeof plans];

      // Create or retrieve customer
      let customer;
      try {
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: customerEmail,
            metadata: { userId }
          });
        }
      } catch (error: any) {
        console.error("Customer creation/retrieval failed:", error);
        return res.status(500).json({ message: "Customer setup failed" });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${selectedPlan.name} - Premium Features`,
                description: 'Full access to AI assistant and advanced scheduling tools'
              },
              unit_amount: selectedPlan.amount,
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${returnUrl || req.headers.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || req.headers.origin}/premium/cancelled`,
        metadata: {
          userId,
          plan,
          customerEmail
        }
      });

      res.json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error: any) {
      console.error("Stripe checkout session creation failed:", error);
      res.status(500).json({ 
        message: "Failed to create checkout session: " + error.message 
      });
    }
  });

  // Create mobile money subscription
  app.post("/api/subscriptions/create-mobile-money", async (req, res) => {
    try {
      const { userId, paymentMethod, phone, plan = 'premium', customerEmail } = req.body;

      if (!userId || !paymentMethod || !phone) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, paymentMethod, phone" 
        });
      }

      // Validate payment method
      const supportedMethods = ['evc', 'zaad', 'edahab'];
      if (!supportedMethods.includes(paymentMethod)) {
        return res.status(400).json({ 
          message: "Unsupported payment method. Supported: " + supportedMethods.join(', ')
        });
      }

      // Generate subscription ID
      const subscriptionId = `sub_mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mobile money provider mapping
      const providers = {
        evc: 'EVC Plus',
        zaad: 'ZAAD', 
        edahab: 'eDahab'
      };

      // Generate payment instructions/USSD codes
      const paymentInstructions = {
        evc: `*788*${phone}*29.99#`,
        zaad: `*252*1*29.99*${phone}#`,
        edahab: `*384*29.99*${phone}#`
      };

      // Create subscription record in database
      const subscription = await storage.createSubscription({
        id: subscriptionId,
        userId,
        plan,
        status: 'pending',
        stripeSubscriptionId: null, // Mobile money doesn't use Stripe
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create user profile if doesn't exist
      try {
        const existingProfile = await storage.getUserProfile(userId);
        if (!existingProfile) {
          await storage.createUserProfile({
            id: `profile_${userId}`,
            userId,
            email: customerEmail || `${phone}@mobile.local`,
            preferences: JSON.stringify({ paymentMethod, phone }),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.log("Profile creation skipped:", error);
      }

      res.json({
        subscriptionId,
        status: 'pending',
        provider: providers[paymentMethod as keyof typeof providers],
        paymentMethod,
        amount: 29.99,
        currency: 'USD',
        ussdCode: paymentInstructions[paymentMethod as keyof typeof paymentInstructions],
        instructions: {
          so: `Dial ${paymentInstructions[paymentMethod as keyof typeof paymentInstructions]} to complete your premium subscription payment`,
          en: `Dial ${paymentInstructions[paymentMethod as keyof typeof paymentInstructions]} to complete your premium subscription payment`,
          ar: `اطلب ${paymentInstructions[paymentMethod as keyof typeof paymentInstructions]} لإتمام دفع اشتراكك المميز`
        },
        message: `Please dial ${paymentInstructions[paymentMethod as keyof typeof paymentInstructions]} to complete your premium subscription payment of $29.99`
      });
    } catch (error: any) {
      console.error("Mobile money subscription creation failed:", error);
      res.status(500).json({ 
        message: "Failed to create mobile money subscription: " + error.message 
      });
    }
  });

  // Simulate mobile money payment completion (for testing)
  app.post("/api/subscriptions/complete-mobile-money", async (req, res) => {
    try {
      const { subscriptionId, transactionId } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID required" });
      }

      // Update subscription status to active
      const subscription = await storage.updateSubscription(subscriptionId, {
        status: 'active',
        updatedAt: new Date()
      });

      res.json({
        success: true,
        subscription,
        message: "Premium subscription activated successfully!"
      });
    } catch (error: any) {
      console.error("Mobile money completion failed:", error);
      res.status(500).json({ 
        message: "Failed to complete mobile money subscription: " + error.message 
      });
    }
  });

  // Get user subscription status
  app.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserSubscription(userId);
      const userProfile = await storage.getUserProfile(userId);

      res.json({
        subscription: subscription || null,
        profile: userProfile || null,
        isPremium: !!(subscription && subscription.status === "active" && subscription.plan === "premium")
      });
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Premium access middleware
  const requirePremium = async (req: any, res: any, next: any) => {
    try {
      const userId = req.params.userId || req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || subscription.status !== "active" || subscription.plan !== "premium") {
        return res.status(403).json({ 
          message: "Premium subscription required",
          upgrade: true
        });
      }

      req.userSubscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: "Subscription check failed" });
    }
  };

  // Premium AI Assistant endpoint (protected)
  app.post("/api/premium/ai-assistant", requirePremium, async (req, res) => {
    try {
      const { prompt, context, userId } = req.body;
      
      // This would integrate with your AI service (OpenAI, Claude, etc.)
      // For now, returning a mock response
      const aiResponse = {
        response: `Premium AI Response to: "${prompt}". This is a premium feature with advanced context understanding and personalized recommendations.`,
        usage: {
          tokens: Math.floor(Math.random() * 1000) + 100
        },
        premium: true
      };

      res.json(aiResponse);
    } catch (error) {
      console.error("AI Assistant error:", error);
      res.status(500).json({ message: "AI Assistant service failed" });
    }
  });

  // Premium scheduling endpoint (protected)
  app.post("/api/premium/schedule", requirePremium, async (req, res) => {
    try {
      const { userId, scheduleData } = req.body;
      
      // Advanced scheduling logic would go here
      const schedule = {
        id: randomUUID(),
        userId,
        ...scheduleData,
        premium: true,
        advancedFeatures: {
          aiOptimization: true,
          conflictResolution: true,
          smartReminders: true
        },
        createdAt: new Date()
      };

      res.json({
        success: true,
        schedule,
        message: "Premium schedule created with advanced features"
      });
    } catch (error) {
      console.error("Premium scheduling error:", error);
      res.status(500).json({ message: "Premium scheduling service failed" });
    }
  });

  // Stripe webhook for subscription events
  app.post("/api/subscriptions/stripe-webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.log("⚠️ Stripe subscription webhook secret not configured");
        return res.status(400).json({ message: "Webhook secret not configured" });
      }

      if (!sig || typeof sig !== 'string') {
        return res.status(400).json({ message: "Missing or invalid signature" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error("Subscription webhook signature verification failed:", err.message);
        return res.status(400).json({ message: "Invalid signature" });
      }

      // Handle subscription events
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          if (session.mode === 'subscription') {
            const { userId, plan, customerEmail } = session.metadata;
            
            // Create user profile if it doesn't exist
            let userProfile = await storage.getUserProfile(userId);
            if (!userProfile) {
              userProfile = await storage.createUserProfile({
                userId,
                email: customerEmail,
                name: null,
                phone: null,
                subscriptionId: null
              });
            }

            // Get the subscription from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            // Create subscription record
            const subscription = await storage.createSubscription({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: stripeSubscription.id,
              plan,
              status: "active",
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              cancelAtPeriodEnd: null
            });

            // Link subscription to user profile
            await storage.updateUserProfile(userId, { subscriptionId: subscription.id });
            
            console.log(`✅ Premium subscription activated for user: ${userId}`);
          }
          break;

        case 'customer.subscription.updated':
          const updatedSubscription = event.data.object;
          const existingSub = await storage.getSubscriptionByStripeId(updatedSubscription.id);
          
          if (existingSub) {
            await storage.updateSubscriptionStatus(
              existingSub.id,
              updatedSubscription.status,
              new Date(updatedSubscription.current_period_start * 1000),
              new Date(updatedSubscription.current_period_end * 1000)
            );
            console.log(`🔄 Subscription updated: ${updatedSubscription.id}`);
          }
          break;

        case 'customer.subscription.deleted':
          const cancelledSubscription = event.data.object;
          const cancelledSub = await storage.getSubscriptionByStripeId(cancelledSubscription.id);
          
          if (cancelledSub) {
            await storage.cancelSubscription(cancelledSub.id);
            console.log(`❌ Subscription cancelled: ${cancelledSubscription.id}`);
          }
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Subscription webhook error:", error);
      res.status(500).json({ message: "Subscription webhook processing failed" });
    }
  });

  // Check if user has access to course
  app.get("/api/access/:courseId/:phone", async (req, res) => {
    try {
      const { courseId, phone } = req.params;
      const payment = await storage.getCompletedPaymentForCourse(courseId, phone);
      
      res.json({
        hasAccess: !!payment,
        payment: payment || null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  // Download course file (protected)
  app.get("/api/download/:courseId/:phone", async (req, res) => {
    try {
      const { courseId, phone } = req.params;
      
      // Verify payment
      const payment = await storage.getCompletedPaymentForCourse(courseId, phone);
      if (!payment) {
        return res.status(403).json({ message: "Access denied. Payment required." });
      }

      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Serve file (PDF format for better mobile compatibility)
      const filePath = path.join(process.cwd(), 'public', course.fileUrl);
      const fileExtension = course.fileUrl.split('.').pop();
      const downloadName = `${course.title.en.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.${fileExtension}`;
      
      res.download(filePath, downloadName, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: "Failed to download course" });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: "Failed to download course" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req.session as any).adminId = admin.id;
      (req.session as any).adminUsername = admin.username;

      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          name: admin.name 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    const isLoggedIn = !!(req.session as any)?.adminId;
    res.json({ 
      isLoggedIn,
      admin: isLoggedIn ? {
        id: (req.session as any).adminId,
        username: (req.session as any).adminUsername
      } : null
    });
  });

  // Admin Course Management Routes
  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(req.params.id, courseData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCourse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const [courses, payments] = await Promise.all([
        storage.getAllCourses(),
        storage.getAllPayments()
      ]);

      const totalRevenue = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const paymentsByMethod = payments.reduce((acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalCourses: courses.length,
        totalPayments: payments.length,
        completedPayments: payments.filter(p => p.status === "completed").length,
        totalRevenue: totalRevenue.toFixed(2),
        paymentsByMethod
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
