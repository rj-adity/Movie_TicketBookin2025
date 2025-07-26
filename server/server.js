import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./src/inngest/index.js"
import showRouter from './routes/showRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize database connection
let dbConnected = false;

const initializeDB = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.vercel.app']
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(clerkMiddleware());

// Initialize DB before handling requests
app.use(async (req, res, next) => {
    await initializeDB();
    next();
});

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

// Function to find available port
const findAvailablePort = (startPort) => {
    return new Promise((resolve) => {
        const server = app.listen(startPort, () => {
            const actualPort = server.address().port;
            console.log(`✅ Server Running at http://localhost:${actualPort}`);
            console.log(`📊 Database: Connected`);
            console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
            resolve(server);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️  Port ${startPort} is busy, trying ${startPort + 1}...`);
                findAvailablePort(startPort + 1).then(resolve);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });
    });
};

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
    findAvailablePort(port);
}

export default app;