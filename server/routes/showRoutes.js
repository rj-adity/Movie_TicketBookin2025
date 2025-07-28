import express from 'express'
import { addShow, getNowPlayingMovies, getShow, getShows, debugShows } from '../controllers/showController.js';
import { protectAdmin } from '../middleware/auth.js';

const showRouter = express.Router();

showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies)
showRouter.post('/add', protectAdmin, addShow)
showRouter.get("/all", getShows)
showRouter.get("/:movieId", getShow)
showRouter.get("/debug/shows", debugShows)

export default showRouter;