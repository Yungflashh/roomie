"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const passport_1 = __importDefault(require("./config/passport"));
const express_session_1 = __importDefault(require("express-session"));
// Import configurations
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const socket_service_1 = require("./socket/socket.service");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const analytics_middleware_1 = require("./middleware/analytics.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const phone_routes_1 = __importDefault(require("./routes/phone.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
// Import jobs
require("./jobs/match.jobs");
require("./jobs/game.jobs");
require("./jobs/subscription.jobs");
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO Service
const socketService = new socket_service_1.SocketService(httpServer);
exports.socketService = socketService;
const io = socketService.getIO();
exports.io = io;
// To trust proxy like render
app.set('trust proxy', 1); //  Trust only the first proxy (Render's proxy)
// Make io and socketService accessible to routes
app.set('io', io);
app.set('socketService', socketService);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
// Rate limiting
app.use('/api', rateLimiter_1.generalLimiter);
app.use((0, cookie_parser_1.default)());
app.use(analytics_middleware_1.trackPageView);
// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/v1/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Roommate Finder API Docs',
}));
// Swagger JSON
app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
// ... (after express.json() and other middleware)
// Session (required for passport)
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// ... (then your routes)
// API Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/profiles', profile_routes_1.default);
app.use('/api/v1/matches', match_routes_1.default);
app.use('/api/v1/chat', chat_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/games', game_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/auth/phone', phone_routes_1.default);
app.use('/api/v1/profiles', profile_routes_1.default);
app.use('/api/v1/search', search_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
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
app.use(errorHandler_1.errorConverter);
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Connect to database
        await (0, database_1.connectDB)();
        // Start listening
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger_1.logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
            logger_1.logger.info(`🔌 WebSocket server ready`);
            logger_1.logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
        });
    }
    catch (error) {
        logger_1.logger.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
};
startServer();
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.logger.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
});
//# sourceMappingURL=server.js.map