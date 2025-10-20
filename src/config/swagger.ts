import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Roommate Finder API',
      version,
      description: 'Comprehensive API documentation for Roommate Finder application',
      contact: {
        name: 'API Support',
        email: 'support@roommatefinder.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.roommatefinder.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
            profilePicture: { type: 'string' },
            bio: { type: 'string' },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RoommateProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            headline: { type: 'string' },
            about: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
            videoIntro: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                coordinates: { type: 'array', items: { type: 'number' } },
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' },
              },
            },
            matchingPreferences: { type: 'object' },
            lifestylePreferences: { type: 'object' },
            interests: { type: 'array', items: { type: 'string' } },
            rating: {
              type: 'object',
              properties: {
                average: { type: 'number' },
                count: { type: 'number' },
              },
            },
            isPremium: { type: 'boolean' },
            completionPercentage: { type: 'number' },
          },
        },
        Match: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user1: { type: 'string' },
            user2: { type: 'string' },
            compatibilityScore: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'expired'] },
            matchedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'object' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Profiles', description: 'Roommate profile management' },
      { name: 'Matches', description: 'Matching and connections' },
      { name: 'Chat', description: 'Real-time messaging' },
      { name: 'Games', description: 'Social gaming features' },
      { name: 'Payments', description: 'Payment and subscription management' },
      { name: 'Notifications', description: 'Notification management' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);