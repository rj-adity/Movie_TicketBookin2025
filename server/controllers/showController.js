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
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "TMDB API key is not configured"
            });
        }

        const { data } = await axios.get(
            'https://api.themoviedb.org/3/movie/now_playing',
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                },
                timeout: 10000
            }
        );

        const movies = data.results || [];
        
        res.status(200).json({
            success: true,
            movies: movies,
            total: movies.length,
            page: data.page || 1,
            total_pages: data.total_pages || 1
        });
    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        
        if (error.response?.status === 401) {
            return res.status(401).json({
                success: false,
                message: "Invalid TMDB API key"
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: "Request timeout - please try again"
            });
        }
        
        res.status(500).json({
            success: false,
            message: error?.response?.data?.status_message || error.message || "Failed to fetch movies",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
                // Validate TMDB API key
                if (!process.env.TMDB_API_KEY) {
                    throw new Error('TMDB API key is not configured');
                }

                // Fetch movie details and credits from TMDB API
                const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                        timeout: 10000
                    }),
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                        timeout: 10000
                    })
                ]);

                const movieApiData = movieDetailsResponse.data;
                const movieCreditsData = movieCreditsResponse.data;

                // Ensure cast data is properly formatted and not empty
                const formattedCast = (movieCreditsData.cast || []).map(castMember => ({
                    cast_id: castMember.cast_id,
                    character: castMember.character || "",
                    credit_id: castMember.credit_id,
                    gender: castMember.gender,
                    id: castMember.id,
                    name: castMember.name || "",
                    order: castMember.order,
                    profile_path: castMember.profile_path
                }));

                const movieDetails = {
                    _id: movieId,
                    title: movieApiData.title || "",
                    overview: movieApiData.overview || "",
                    poster_path: movieApiData.poster_path || "",
                    backdrop_path: movieApiData.backdrop_path || "",
                    genres: movieApiData.genres || [],
                    casts: formattedCast, // Properly formatted cast array
                    release_date: movieApiData.release_date || "",
                    original_language: movieApiData.original_language || "",
                    tagline: movieApiData.tagline || "",
                    vote_average: movieApiData.vote_average || 0,
                    runtime: movieApiData.runtime || 0,
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
                    
                    // Check if show is in the future
                    if (showDateTime <= new Date()) {
                        throw new Error(`Show time must be in the future: ${dateTimeString}`);
                    }
                    
                    showsToCreate.push({
                        movie: movieId,
                        showDateTime,
                        showPrice,
                        occupiedSeats: {}
                    });
                });
            });

            if (showsToCreate.length > 0) {
                await Show.insertMany(showsToCreate, { session });
            }
        });

        res.status(201).json({
            success: true,
            message: 'Show added successfully',
            showsCreated: showsInput.reduce((total, show) => total + show.time.length, 0)
        });

    } catch (error) {
        console.error('Error adding show:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found in TMDB database'
            });
        }
        
        if (error.response?.status === 401) {
            return res.status(401).json({
                success: false,
                message: 'Invalid TMDB API key'
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Request timeout - please try again'
            });
        }
        
        res.status(400).json({
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

        // Get unique movie objects from shows with proper cast and dateTime formatting
        const uniqueMovies = [...new Map(shows.map(s => [s.movie._id.toString(), s.movie])).values()];

        // Ensure cast and other fields are properly formatted
        const formattedMovies = uniqueMovies.map(movie => ({
            _id: movie._id,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_date: movie.release_date,
            original_language: movie.original_language,
            tagline: movie.tagline || "",
            genres: movie.genres || [],
            casts: movie.casts || [], // Ensure cast is always an array
            vote_average: movie.vote_average,
            runtime: movie.runtime,
            createdAt: movie.createdAt,
            updatedAt: movie.updatedAt
        }));

        res.status(200).json({
            success: true,
            movies: formattedMovies,
            count: formattedMovies.length
        });
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

        // Format movie data to ensure cast is visible
        const formattedMovie = {
            _id: movie._id,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_date: movie.release_date,
            original_language: movie.original_language,
            tagline: movie.tagline || "",
            genres: movie.genres || [],
            casts: movie.casts || [], // Ensure cast is always visible
            vote_average: movie.vote_average,
            runtime: movie.runtime,
            createdAt: movie.createdAt,
            updatedAt: movie.updatedAt
        };

        const dateTime = {};
        shows.forEach(show => {
            // Use local date formatting for better consistency
            const showDate = new Date(show.showDateTime);
            const date = showDate.toISOString().split("T")[0];
            
            if (!dateTime[date]) {
                dateTime[date] = [];
            }

            // Format time as HH:mm with proper timezone handling
            const time = showDate.toISOString().split("T")[1].substring(0, 5);

            dateTime[date].push({
                time,
                showId: show._id,
                showDateTime: show.showDateTime.toISOString(), // Include full datetime for reference
                showPrice: show.showPrice
            });
        });

        res.status(200).json({
            success: true,
            movie: formattedMovie,
            dateTime,
            totalShows: shows.length
        });
    } catch (error) {
        console.error('Error fetching show details:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}