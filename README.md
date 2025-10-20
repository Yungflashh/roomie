# Roommate Finder API

A comprehensive RESTful API for a roommate finder mobile application with advanced matching algorithms, real-time chat, social gaming features, and payment integration.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with refresh tokens
- **Smart Matching Algorithm** - 7-factor compatibility scoring
- **Real-time Chat** - Socket.IO with WebRTC for voice/video calls
- **Social Gaming** - Multiplayer games, leaderboards, achievements
- **Payment Integration** - Stripe subscriptions and one-time payments
- **Location Tracking** - Real-time location sharing with privacy controls
- **File Uploads** - Cloudinary integration for images and videos
- **Background Jobs** - Bull queues for async processing
- **Admin Dashboard** - Complete management interface
- **API Documentation** - Interactive Swagger/OpenAPI docs

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Redis (v7 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/roommate-finder-api.git
   cd roommate-finder-api
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment variables**
```bash
   cp .env.example .env
   # Edit .env with your configuration
```

4. **Start services (using Docker Compose)**
```bash
   docker-compose up -d mongodb redis
```

5. **Run database migrations/seeds**
```bash
   npm run seed:games
```

6. **Start the development server**
```bash
   npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

Interactive API documentation is available at:
- Development: `http://localhost:5000/api/v1/docs`
- Production: `https://api.roommatefinder.com/api/v1/docs`

## 🧪 Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## 📁 Project Structure
```
roommate-finder-api/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   ├── jobs/            # Background jobs
│   ├── socket/          # Socket.IO handlers
│   └── server.ts        # Entry point
├── tests/               # Test files
├── scripts/             # Utility scripts
├── logs/                # Log files
└── uploads/             # Uploaded files
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `CLOUDINARY_*` - Cloudinary configuration

## 🚢 Deployment

### Using Docker
```bash
# Build image
docker build -t roommate-finder-api .

# Run container
docker run -p 5000:5000 --env-file .env.production roommate-finder-api
```

### Manual Deployment
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- System metrics: `GET /api/v1/admin/system/health` (Admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by modern roommate finding applications
- Built with love and TypeScript

## 📧 Support

For support, email support@roommatefinder.com or join our Slack channel.