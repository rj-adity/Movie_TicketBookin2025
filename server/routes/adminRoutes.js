import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getAllUsers, getDashboardData, isAdmin, debugClerk, getUserByEmail, getTotalUserCount, syncBookingsWithClerk } from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows);
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.get('/all-users', protectAdmin, getAllUsers)
adminRouter.get('/debug-clerk', protectAdmin, debugClerk)
adminRouter.get('/user/:email', protectAdmin, getUserByEmail)
adminRouter.get('/total-users', protectAdmin, getTotalUserCount)
adminRouter.get('/sync-bookings', protectAdmin, syncBookingsWithClerk)

export default adminRouter;