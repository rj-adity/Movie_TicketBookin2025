import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./src/inngest/index.js";
import showRouter from './routes/showRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

// Stripe webhook route FIRST (no body parsing before this)
app.use('/api/stripe', express.raw({type: 'application/json'}), stripeWebhooks );

// Now add body parsing and CORS for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://movie-ticket-bookin20252.vercel.app', 'https://moviebooking2025-server.vercel.app'],
    credentials: true
}));

app.use(clerkMiddleware());

// API Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Server is Live',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/booking', bookingRouter);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler LAST
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Only start the server locally (not on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const startServer = async () => {
        try {
            await connectDB();
            console.log('📊 Database: Connected');
            app.listen(port, () => {
                console.log(`✅ Server Running at http://localhost:${port}`);
                console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
            }).on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`⚠️  Port ${port} is busy, please use a different port.`);
                } else {
                    console.error('❌ Server error:', err);
                }
                process.exit(1);
            });
        } catch (error) {
            console.error('Database initialization failed:', error);
            process.exit(1);
        }
    };
    startServer();
} else {
    // On Vercel, connect to DB on first request (cold start)
    connectDB().then(() => {
        console.log('📊 Database: Connected (Vercel)');
    }).catch((error) => {
        console.error('Database initialization failed (Vercel):', error);
    });
}

// Always export the app for Vercel
export default app;