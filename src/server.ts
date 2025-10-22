import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import passport from './config/passport';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import ApiError from '../src/utils/ApiError';


// Import configurations
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorConverter, errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { SocketService } from './socket/socket.service';
import cookieParser from 'cookie-parser';
import  {trackPageView}  from './middleware/analytics.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import matchRoutes from './routes/match.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import gameRoutes from './routes/game.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import phoneRoutes from './routes/phone.routes';
import searchRoutes from './routes/search.routes';
import analyticsRoutes from './routes/analytics.routes';






// Import jobs

import './jobs/match.jobs';
import './jobs/game.jobs';
import './jobs/subscription.jobs';



// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO Service
const socketService = new SocketService(httpServer);
const io = socketService.getIO();



// To trust proxy like render
app.set('trust proxy', 1); //  Trust only the first proxy (Render's proxy)


// Make io and socketService accessible to routes

app.set('io', io);
app.set('socketService', socketService);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api', generalLimiter);

app.use(cookieParser());

app.use(trackPageView);



// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Roommate Finder API Docs',
}));



// global error 

app.use((err:any, req:Request, res:Response, next:NextFunction) => {
  console.error('Unhandled Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.details || null,  // <-- send details if present
    });
  }

  res.status(500).json({ message: 'Internal Server Error' });
});



// Swagger JSON
app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// ... (after express.json() and other middleware)

// Session (required for passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ... (then your routes)


// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/phone', phoneRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);











// API documentation
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Roommate Finder API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      profiles: '/api/v1/profiles',
      matches: '/api/v1/matches',
      chat: '/api/v1/chat',
      games: '/api/v1/games',
      payments: '/api/v1/payments',
    },
    documentation: '/api/v1/docs',
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorConverter);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

export { app, io, socketService };