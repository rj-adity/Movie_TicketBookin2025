import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // If already connected with a ready connection, use it
    if (mongoose.connection.readyState === 1) {
        console.log('Using existing MongoDB connection');
        return mongoose.connection;
    }

    // If connection is connecting, wait for it
    if (mongoose.connection.readyState === 2) {
        console.log('Waiting for existing connection...');
        await new Promise(resolve => mongoose.connection.once('open', resolve));
        return mongoose.connection;
    }

    // Connection is closed (readyState === 0) or disconnected (readyState === 3), create new connection
    try {
        console.log('Creating new MongoDB connection...');
        mongoose.set('strictQuery', false);

        const options = {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            retryWrites: true,
            retryReads: true,
        };

        await mongoose.connect(MONGODB_URI, options);
        console.log('MongoDB Connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

export default connectDB;