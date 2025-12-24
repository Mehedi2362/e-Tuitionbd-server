import 'dotenv/config'
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

//CORS Configuration
app.use(cors({
    origin: getEnv.string('CLIENT_URL', 'http://localhost:3000'),
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
