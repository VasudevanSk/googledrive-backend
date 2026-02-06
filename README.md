# Google Drive Clone - Backend

Complete Node.js + Express + MongoDB + AWS S3 backend for the Google Drive clone application.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- AWS account with S3 bucket

### 2. Installation

```bash
# Clone and enter directory
cd googledrive-backend

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env` file with:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/googledrive?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email (for activation/reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/activate/:token` - Activate account
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile (protected)

### Files & Folders
- `GET /api/files` - List files in current folder
- `POST /api/files/folder` - Create new folder
- `POST /api/files/upload` - Upload file to S3
- `GET /api/files/download/:id` - Get download URL
- `PATCH /api/files/:id` - Rename file/folder
- `DELETE /api/files/:id` - Delete file/folder

## Project Structure

```
googledrive-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── s3.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── fileController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   └── File.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── files.js
│   ├── utils/
│   │   └── email.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Deployment

### Deploy to Render/Railway/Heroku

1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy!

### AWS S3 Bucket Policy

Make sure your S3 bucket has proper CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```
