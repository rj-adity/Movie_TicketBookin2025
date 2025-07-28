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
import { stripeWebhooks, testWebhook } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.vercel.app']
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

// Register the test endpoint BEFORE the raw middleware
app.get('/api/stripe/test', testWebhook);
// Only the webhook endpoint uses express.raw
app.use('/api/stripe', express.raw({type: 'application/json' }), stripeWebhooks );
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

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Main function to start the server
const startServer = async () => {
    try {
        // 1. Connect to the database
        await connectDB();
        console.log('📊 Database: Connected');

        // 2. Start listening for requests ONLY after the DB is connected
        app.listen(port, () => {
            console.log(`✅ Server Running at http://localhost:${port}`);
            console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
        }).on('error', (err) => {
            // Handle port-in-use error if you still need that functionality
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

// Start the server
if (process.env.NODE_ENV !== 'production') {
    startServer();
}

// For Vercel serverless deployment
export default app;