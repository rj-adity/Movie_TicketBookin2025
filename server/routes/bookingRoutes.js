import express from 'express';
import { createBooking, getOccupiedSeats, regeneratePaymentLink } from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/create', createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);
bookingRouter.post('/regenerate-payment/:bookingId', regeneratePaymentLink);

export default bookingRouter;