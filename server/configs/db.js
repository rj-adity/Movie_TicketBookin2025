import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        // Set mongoose options for better serverless performance
        mongoose.set('strictQuery', false);
        
        const options = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/Chitrapat`, options);
        
        isConnected = true;
        console.log(`Database Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('Database connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Database disconnected');
            isConnected = false;
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
        isConnected = false;
        throw error;
    }
};

export default connectDB;