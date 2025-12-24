import 'dotenv/config.js'
import { Server } from "./config/server.js";
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from "compression";
import { getEnv } from "./shared/utils/getEnv.js";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from './shared/middleware/index.js';
import { paymentsRouter } from './features/payments/index.js';
import { dashboardRouter } from './features/dashboard/index.js';
import { publicRoutes } from './features/public/index.js';
import { reviewRouter } from './features/reviews/index.js';
import authRouter from './features/auth/routes.js';
import { firebase } from './config/firebase.js';

// Initialize Firebase Admin SDK
firebase.init();

const app: Express = express()

//Security Middleware
app.use(helmet())
app.use(compression())

// Database connection middleware for serverless (Vercel)
import { db } from './config/db.js';
app.use(async (req, res, next) => {
    try {
        await db.connect();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

//CORS Configuration
const allowedOrigins = [
    getEnv.string('CLIENT_URL', 'http://localhost:3000'),
    'https://e-tuitionbd.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
].map(url => url.replace(/\/$/, '')); // Remove trailing slashes

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        // Normalize origin by removing trailing slash
        const normalizedOrigin = origin.replace(/\/$/, '');

        if (allowedOrigins.some(allowed => normalizedOrigin === allowed)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}))

//Request Parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Cookie Parser
app.use(cookieParser())

// ==================== Request Logging ====================
let requestCounter = 0;
const requestLog: Record<string, number> = {};

app.use((req, res, next) => {
    requestCounter++;
    const endpoint = `${req.method} ${req.path}`;
    requestLog[endpoint] = (requestLog[endpoint] || 0) + 1;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] #${requestCounter} ${endpoint} (${requestLog[endpoint]}x)`);
    next();
});

// ==================== API Routes ====================
const API_BASE = '/api/v1';
app.use(API_BASE, authRouter);       // Auth (register, login, logout, etc.)
app.use(API_BASE, publicRoutes);     // Public (tuitions, tutors browsing)
app.use(API_BASE, dashboardRouter);  // Dashboard (admin, student, tutor)
app.use(API_BASE, reviewRouter);     // Reviews (tutor reviews)
app.use(API_BASE, paymentsRouter);   // Payments (Stripe)

// ==================== Error Handling ====================
app.use(notFoundHandler);
app.use(errorHandler);

// Start server (only in non-Vercel environment)
if (process.env.VERCEL !== '1') {
    await Server.start(app);
}

// Export for Vercel
export default app;
