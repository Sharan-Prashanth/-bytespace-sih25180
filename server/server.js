import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db..js";

import authRoutes from "./routes/authRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";


// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/blockchain", blockchainRoutes);
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NaCCER Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Email test route (for development)
app.get('/api/test-email', async (req, res) => {
  try {
    const emailService = (await import('./services/emailService.js')).default;
    
    // Test email connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: 'Email service connection failed',
        error: connectionTest.error
      });
    }

    // Send test email
    const testResult = await emailService.sendWelcomeEmail(
      process.env.EMAIL_USER,
      'Test User',
      'user'
    );

    res.json({
      success: true,
      message: 'Email test completed',
      connectionTest,
      emailTest: testResult
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/collaboration", collaborationRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
  console.log(`🔗 Frontend should be at ${process.env.CLIENT_URL || 'http://localhost:3001'}`);
});
