# Attendance Tracker Backend

Node.js/Express backend for the Smart Attendance Management System.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Seed database (optional):

```bash
npm run seed
```

5. Start development server:

```bash
npm run dev
```

Server runs on http://localhost:5000

## Scripts

- `npm start` - Run production server
- `npm run dev` - Run development server with nodemon
- `npm run seed` - Seed database with sample data

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_tracker
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

## API Structure

### Routes

- `/api/auth` - Authentication routes
- `/api/classes` - Class management routes
- `/api/students` - Student management routes
- `/api/attendance` - Attendance routes
- `/api/reports` - Report generation routes

### Models

- Teacher - User authentication
- Class - Class information
- Student - Student details
- Attendance - Attendance records
- Report - Generated reports

## Database

Uses MongoDB with Mongoose ODM

## Middleware

- JWT authentication
- Error handling
- CORS support
- File upload (Multer)

## Features

- JWT-based authentication
- Role-based access control
- CSV parsing and validation
- Attendance tracking
- Report generation
- Cascade delete operations
- Form validation
- Error handling

## Deployment

For production:

1. Set NODE_ENV=production
2. Use a production MongoDB instance
3. Update JWT_SECRET with a strong key
4. Configure proper CORS origins
5. Use a process manager (pm2, forever, etc.)
