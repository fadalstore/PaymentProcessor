import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertCourseSchema, insertAdminUserSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
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
