# SIH Backend - Enterprise Grade Express.js API

A comprehensive, production-ready Express.js backend with modern architecture and best practices.

## 🏗️ Architecture Overview

```
backend/
├── src/
│   ├── app.js              # Main application setup
│   ├── config/
│   │   └── config.js       # Environment configuration
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # Authentication & authorization
│   │   ├── errorHandler.js # Error handling
│   │   └── validation.js   # Request validation
│   ├── models/             # Data models (add your DB models here)
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── healthRoutes.js
│   │   └── userRoutes.js
│   ├── services/           # Business logic
│   │   ├── emailService.js
│   │   ├── fileUploadService.js
│   │   ├── otpService.js
│   │   └── userService.js
│   ├── utils/              # Utility functions
│   │   ├── helpers.js
│   │   ├── logger.js
│   │   └── responseHelper.js
│   └── validators/         # Custom validators
├── uploads/                # File upload directory
├── logs/                   # Application logs
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── server.js               # Server entry point
```

## 🚀 Features

### Core Features
- ✅ **Modern ES6+ Modules** - Using import/export syntax
- ✅ **TypeScript Ready** - Can be easily converted to TypeScript
- ✅ **Production Security** - Helmet, CORS, Rate limiting
- ✅ **Comprehensive Logging** - Winston logger with multiple transports
- ✅ **Error Handling** - Centralized error handling with custom error types
- ✅ **Request Validation** - Joi-based validation with sanitization
- ✅ **File Upload** - Multer-based file handling with validation
- ✅ **Email Service** - Nodemailer integration with templates
- ✅ **OTP Service** - SMS OTP generation and verification

### Authentication & Authorization
- 🔐 **JWT Authentication** - Access and refresh tokens
- 🔑 **Role-based Access Control** - Admin, user roles
- 🛡️ **Permission-based Authorization** - Granular permissions
- 👤 **User Management** - Registration, login, profile management
- 📧 **Email Verification** - Account activation via email
- 📱 **Phone Verification** - OTP-based phone verification
- 🔒 **Password Security** - Bcrypt hashing, password reset

### API Features
- 📄 **Pagination** - Consistent pagination across endpoints
- 🔍 **Search & Filtering** - Query-based search functionality
- 📊 **Health Monitoring** - Health check endpoints for monitoring
- 🎯 **Rate Limiting** - IP-based request limiting
- 📤 **File Management** - Image and document upload/download
- 📈 **Request Logging** - Detailed API usage logging

## 🛠️ Getting Started

### Prerequisites
- Node.js v18+ (current version: v22.19.0)
- npm or yarn
- (Optional) Database (MongoDB, PostgreSQL, etc.)
- (Optional) Redis for caching

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Environment setup:**
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server:**
```bash
npm run dev
```

4. **Start production server:**
```bash
npm start
```

### Environment Variables

Key environment variables to configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Database
DATABASE_URL=your-database-url

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email
EMAIL_PASS=your-app-password
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/detailed` | Detailed system info |
| GET | `/api/health/live` | Kubernetes liveness probe |
| GET | `/api/health/ready` | Kubernetes readiness probe |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/verify-otp` | Verify phone OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| GET | `/api/auth/me` | Get current user profile |

### User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Owner/Admin |
| PUT | `/api/users/:id` | Update user profile | Owner/Admin |
| DELETE | `/api/users/:id` | Delete user account | Owner/Admin |
| PATCH | `/api/users/:id/avatar` | Update user avatar | Owner/Admin |
| GET | `/api/users/stats/overview` | User statistics | Admin |
| GET | `/api/users/search/query` | Search users | Admin |
| GET | `/api/users/:id/activity` | User activity log | Owner/Admin |
| PATCH | `/api/users/:id/status` | Update user status | Admin |

## 🔧 Development

### Adding New Features

1. **Create Model** (if using database):
```javascript
// src/models/ExampleModel.js
export const ExampleSchema = {
  // Define your schema
};
```

2. **Create Service**:
```javascript
// src/services/exampleService.js
class ExampleService {
  async create(data) {
    // Business logic
  }
}
export default new ExampleService();
```

3. **Create Controller**:
```javascript
// src/controllers/exampleController.js
import exampleService from '../services/exampleService.js';

class ExampleController {
  async create(req, res, next) {
    try {
      const result = await exampleService.create(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
export default new ExampleController();
```

4. **Create Routes**:
```javascript
// src/routes/exampleRoutes.js
import express from 'express';
import exampleController from '../controllers/exampleController.js';

const router = express.Router();
router.post('/', exampleController.create);
export default router;
```

5. **Register Routes**:
```javascript
// src/app.js
import exampleRoutes from './routes/exampleRoutes.js';
app.use('/api/examples', authMiddleware, exampleRoutes);
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📦 Dependencies

### Production Dependencies
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **compression** - Response compression
- **express-rate-limit** - Rate limiting
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT implementation
- **joi** - Schema validation
- **multer** - File upload handling
- **nodemailer** - Email sending
- **winston** - Logging library
- **dotenv** - Environment variables

### Development Dependencies
- **nodemon** - Auto-restart server

## 🚦 Deployment

### Environment Setup

1. **Production Environment Variables**:
```env
NODE_ENV=production
JWT_SECRET=secure-production-secret
DATABASE_URL=production-database-url
```

2. **Database Setup**:
- Configure your production database
- Run migrations if using a SQL database
- Set up database indexes for performance

3. **File Storage**:
- Configure cloud storage (AWS S3, Google Cloud Storage)
- Update file upload service accordingly

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Management

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "sih-backend"
pm2 startup
pm2 save
```

## 📊 Monitoring

### Health Checks
- `/api/health` - Basic health status
- `/api/health/detailed` - System metrics
- Application logs in `logs/` directory
- Winston logger with multiple log levels

### Performance Monitoring
- Request logging with Morgan
- Error tracking with Winston
- Performance metrics logging
- Memory and CPU usage monitoring

## 🔒 Security

### Implemented Security Measures
- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - Request throttling
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Input Validation** - Joi validation
- **Sanitization** - XSS protection
- **Error Handling** - No sensitive data exposure

### Security Best Practices
- Regular dependency updates
- Environment variable protection
- HTTPS in production
- Database query protection
- File upload restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📝 License

ISC License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**:
```bash
# Kill existing processes
taskkill /f /im node.exe  # Windows
killall node              # Linux/Mac
```

2. **Module not found**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

3. **Environment variables not loading**:
- Check `.env` file exists
- Verify file encoding (UTF-8)
- Ensure no spaces around `=` in env vars

4. **Database connection issues**:
- Verify database URL
- Check network connectivity
- Ensure database service is running

### Support

For additional support:
- Check the logs in `logs/` directory
- Review error messages in console
- Check health endpoints for system status
- Review environment configuration

---

**Built with ❤️ for SIH Project**