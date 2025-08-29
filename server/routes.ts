import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all courses
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

  const httpServer = createServer(app);
  return httpServer;
}
