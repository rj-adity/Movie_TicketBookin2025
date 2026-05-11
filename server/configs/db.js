import mongoose from "mongoose";

let cached = global.mongoose;
if (!cached) {
    global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('Using existing database connection');
        return cached.conn;
    }

    if (!cached.promise) {
        mongoose.set('strictQuery', false);

        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, options).then((mongoose) => {
            console.log('Database Connected');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

export default connectDB;