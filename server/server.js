import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";
import versionRoutes from "./routes/versionRoutes.js";
import { initializeCollaboration } from "./services/collaborationService.js";
import { createHocuspocusServer } from "./services/yjsService.js";


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
app.use("/api/versions", versionRoutes);
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
app.use("/api/auth", authRoutes); // Auth routes (includes admin endpoints at /api/auth/admin/*)
app.use("/api/proposals", proposalRoutes); // Updated proposal routes with new schema
app.use("/api/reviews", reviewRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/upload", uploadRoutes); // Upload routes for Supabase
app.use("/api/admin", adminRoutes); // Admin routes for user and proposal management

// Global error handler
app.use(errorHandler);

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Socket.IO collaboration (presence/awareness only)
initializeCollaboration(io);

// Initialize Hocuspocus Yjs server (editor CRDT synchronization)
const hocuspocus = createHocuspocusServer(httpServer);

// Make io accessible to routes
app.set('io', io);
app.set('hocuspocus', hocuspocus);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready for presence/awareness (port ${PORT})`);
  console.log(`📝 Hocuspocus Yjs server ready for CRDT sync (port 1234)`);
  console.log(`🔗 Frontend should be at ${process.env.CLIENT_URL || 'http://localhost:3001'}`);
});
