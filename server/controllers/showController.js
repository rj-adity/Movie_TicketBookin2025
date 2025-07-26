import mongoose from "mongoose";
import axios from 'axios';

import Show from "../models/Show.js";
import Movie from "../models/Movies.js";

// Input validation helper
const validateShowInput = (movieId, showsInput, showPrice) => {
    if (!movieId || !showsInput || !showPrice) {
        throw new Error('Missing required fields: movieId, showsInput, and showPrice are required');
    }
    
    if (!Array.isArray(showsInput) || showsInput.length === 0) {
        throw new Error('showsInput must be a non-empty array');
    }
    
    if (typeof showPrice !== 'number' || showPrice <= 0) {
        throw new Error('showPrice must be a positive number');
    }
    
    // Validate each show input
    showsInput.forEach((show, index) => {
        if (!show.date || !show.time || !Array.isArray(show.time)) {
            throw new Error(`Invalid show at index ${index}: date and time array are required`);
        }
    });
};

// Get now playing movies from TMDB (Admin only)
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get(
            'https://api.themoviedb.org/3/movie/now_playing',
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                },
            }
        );

        const movies = data.results;
        res.status(200).json({ success: true, movies: movies });
    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        res.status(500).json({
            success: false,
            message: error?.response?.data?.status_message || error.message || "Something went wrong",
        });
    }
}

// Add new shows for a movie (Admin only)
export const addShow = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        const { movieId, showsInput, showPrice } = req.body;
        
        // Validate input
        validateShowInput(movieId, showsInput, showPrice);
        
        await session.withTransaction(async () => {
            let movie = await Movie.findById(movieId).session(session);

            if (!movie) {
                // Fetch movie details and credits from TMDB API
                const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                    }),
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                    })
                ]);

                const movieApiData = movieDetailsResponse.data;
                const movieCreditsData = movieCreditsResponse.data;

                const movieDetails = {
                    _id: movieId,
                    title: movieApiData.title,
                    overview: movieApiData.overview,
                    poster_path: movieApiData.poster_path,
                    backdrop_path: movieApiData.backdrop_path,
                    genres: movieApiData.genres || [],
                    casts: movieCreditsData.cast || [],  // ✅ Proper fallback
                    release_date: movieApiData.release_date,
                    original_language: movieApiData.original_language,
                    tagline: movieApiData.tagline || "",
                    vote_average: movieApiData.vote_average,
                    runtime: movieApiData.runtime,
                };

                // Save movie to DB
                movie = await Movie.create([movieDetails], { session });
                movie = movie[0]; // create returns array when using session
            }

            const showsToCreate = [];
            showsInput.forEach(show => {
                const showDate = show.date;
                show.time.forEach(time => {
                    const dateTimeString = `${showDate}T${time}`;
                    const showDateTime = new Date(dateTimeString);
                    
                    // Validate date
                    if (isNaN(showDateTime.getTime())) {
                        throw new Error(`Invalid date/time format: ${dateTimeString}`);
                    }
                    
                    showsToCreate.push({
                        movie: movieId,
                        showDateTime,
                        showPrice,
                        occupiedSeats: {}  // ✅ Fixed field name
                    });
                });
            });

            if (showsToCreate.length > 0) {
                await Show.insertMany(showsToCreate, { session });
            }
        });

        res.status(201).json({ success: true, message: 'Show added successfully' });

    } catch (error) {
        console.error('Error adding show:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ 
                success: false, 
                message: 'Movie not found in TMDB database' 
            });
        }
        
        res.status(400).json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
}

// Get all upcoming shows (no auth)
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } })
            .populate('movie')
            .sort({ showDateTime: 1 });

        // Get unique movie objects from shows
        const uniqueMovies = [...new Map(shows.map(s => [s.movie._id.toString(), s.movie])).values()];

        res.status(200).json({ success: true, movies: uniqueMovies });
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all upcoming shows for a specific movieId (no auth)
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        
        if (!movieId) {
            return res.status(400).json({ success: false, message: 'Movie ID is required' });
        }
        
        // Validate movieId format (for TMDB IDs, should be numeric)
        if (!/^\d+$/.test(movieId)) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID format' });
        }

        const shows = await Show.find({ 
            movie: movieId, 
            showDateTime: { $gte: new Date() } 
        }).sort({ showDateTime: 1 });

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        const dateTime = {};
        shows.forEach(show => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if (!dateTime[date]) dateTime[date] = [];

            // Format time as HH:mm
            const time = show.showDateTime.toISOString().split("T")[1].substring(0, 5);

            dateTime[date].push({ time, showId: show._id });
        });

        res.status(200).json({ success: true, movie, dateTime });
    } catch (error) {
        console.error('Error fetching show details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}