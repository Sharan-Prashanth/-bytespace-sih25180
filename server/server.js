import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import versionRoutes from "./routes/versionRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import collaborationApiRoutes from "./routes/collaborationApiRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import expertOpinionRoutes from "./routes/expertOpinionRoutes.js";
import clarificationReportRoutes from "./routes/clarificationReportRoutes.js";

// Import collaboration service and socket handlers (legacy - kept for backwards compatibility)
import collaborationService from "./services/collaborationService.js";
import initializeCollaborationSockets from "./sockets/collaborationSocket.js";

// Import Hocuspocus server for Yjs collaboration
import createHocuspocusServer, { getActiveUsers, getActiveDocuments } from "./services/hocuspocusServer.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve template and assets as static files
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/template', express.static(path.join(__dirname, '..', 'template')));
app.use('/template/assets', express.static(path.join(__dirname, '..', 'assets')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NaCCER Portal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
      'USER'
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

// API Routes - Order matters! More specific routes first
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/proposals/:proposalId/versions', versionRoutes);
app.use('/api/proposals/:proposalId/comments', commentRoutes);
app.use('/api/proposals/:proposalId/chat', chatRoutes);
app.use('/api/proposals/:proposalId/reports', reportRoutes);
app.use('/api/proposals/:proposalId/opinions', expertOpinionRoutes);
app.use('/api/reports', reportRoutes); // Direct report routes (for submit, get by id, etc.)
app.use('/api/clarification-reports', clarificationReportRoutes); // Clarification report routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/collaboration-api', collaborationApiRoutes);
app.use('/api/comments', commentRoutes); // Direct comment routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const httpServer = createServer(app);

// Socket.io setup for real-time collaboration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize collaboration socket handlers
initializeCollaborationSockets(io);

// Make io and collaboration service accessible to routes
app.set('io', io);
app.set('collaborationService', collaborationService);

const PORT = process.env.PORT || 5000;
const HOCUSPOCUS_PORT = process.env.HOCUSPOCUS_PORT || 4000;

// Initialize Hocuspocus server for Yjs collaboration
let hocuspocusServer = null;

const initializeHocuspocus = async () => {
  try {
    hocuspocusServer = createHocuspocusServer();
    
    // Start Hocuspocus server (returns a Promise in v3.x)
    await hocuspocusServer.listen(HOCUSPOCUS_PORT);
    console.log(`[Hocuspocus] Yjs collaboration server running on port ${HOCUSPOCUS_PORT}`);
    
    // Make Hocuspocus utilities accessible to routes
    app.set('hocuspocus', {
      server: hocuspocusServer,
      getActiveUsers,
      getActiveDocuments
    });
  } catch (error) {
    console.warn('[Hocuspocus] Failed to initialize Yjs server:', error.message);
    console.warn('[Hocuspocus] Falling back to Socket.io only mode');
  }
};

// Initialize Hocuspocus
initializeHocuspocus();

httpServer.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  NaCCER Research Portal API Server');
  console.log('='.repeat(60));
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Server URL: http://localhost:${PORT}`);
  console.log(`  Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  if (hocuspocusServer) {
    console.log(`  Hocuspocus (Yjs): ws://localhost:${HOCUSPOCUS_PORT}`);
  }
  console.log('='.repeat(60));
  console.log(`  API Routes:`);
  console.log(`    - Health Check: GET /api/health`);
  console.log(`    - Auth: /api/auth/*`);
  console.log(`    - Users: /api/users/*`);
  console.log(`    - Proposals: /api/proposals/*`);
  console.log(`    - Workflow: /api/workflow/*`);
  console.log('='.repeat(60));
});
