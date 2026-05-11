import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log('Using existing database connection');
        return mongoose.connection;
    }

    try {
        mongoose.set('strictQuery', false);

        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log('Database Connected');
        return conn;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

export default connectDB;