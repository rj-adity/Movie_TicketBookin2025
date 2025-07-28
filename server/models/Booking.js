import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    clerkUserId: {type: String, required: true}, // Clerk user ID instead of local user reference
    show: {type: String, required: true, ref: 'Show'},
    amount: {type: Number, required: true},
    bookedSeats: {type: Array, required: true},
    isPaid: {type: Boolean, default: false},
    paymentLink: {type: String, default: false},
    paymentExpiresAt: {type: Date, default: null},
    
},{timestamps: true})

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;