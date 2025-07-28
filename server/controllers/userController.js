import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movies.js";
import mongoose from "mongoose";

// Get user bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const bookings = await Booking.find({ clerkUserId: userId }).populate({
      path: 'show',
      populate: {
        path: 'movie',
        model: 'Movie'
      }
    });
    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching bookings."
    });
  }
};

// --- ADDING DEBUGGING TO THIS FUNCTION ---
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    // --- LOGGING ---
    console.log(`[Backend DEBUG] Attempting to update favorites for userId: ${userId} with movieId: ${movieId}`);
    
    if (!movieId || !userId) {
        return res.status(400).json({ success: false, message: "User ID or Movie ID is missing." });
    }

    const user = await clerkClient.users.getUser(userId);

    // Normalize favorites to an array of strings
    let favorites = (user.privateMetadata.favorites || []).map(String);
    const normalizedMovieId = String(movieId);
    
    console.log(`[Backend DEBUG] Current favorites before change:`, favorites);

    if (!favorites.includes(normalizedMovieId)) {
      favorites.push(normalizedMovieId);
      console.log(`[Backend DEBUG] Added movie. New favorites:`, favorites);
    } else {
      favorites = favorites.filter(id => id !== normalizedMovieId);
      console.log(`[Backend DEBUG] Removed movie. New favorites:`, favorites);
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        favorites,
      },
    });
    
    console.log(`[Backend DEBUG] Successfully updated Clerk metadata.`);

    res.json({
      success: true,
      message: "Favourite movie updated successfully",
    });

  } catch (error) {
    // --- BETTER ERROR LOGGING ---
    console.error("[Backend ERROR] in updateFavorite controller:", error);
    // Send a more specific error message back to the frontend
    res.status(500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

// Get user's favorite movies
// In your backend project: controllers/userController.js

// ... (getUserBookings and updateFavorite functions are correct and stay the same) ...

// --- [THE FINAL FIX IS HERE] ---
// Get user's favorite movies by searching the correct field for the TMDB ID.
// In your backend project: controllers/userController.js

// ... (getUserBookings and updateFavorite functions are correct and stay the same) ...


// --- [THE FINAL, CORRECTED VERSION of getFavorites] ---
// This function is now written to match your exact Movie schema.
export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);

    // This gives you the clean array of TMDB ID strings from Clerk, e.g., ['1011477']
    const favoriteMovieIds = (user.privateMetadata.favorites || []).map(String);

    // If the user has no favorites, return an empty array.
    if (favoriteMovieIds.length === 0) {
      return res.json({ success: true, movies: [] });
    }

    // --- THIS IS THE CORRECTED QUERY ---
    // It tells MongoDB: "Find all documents in the 'Movie' collection
    // where the string `_id` field is one of the values in the favoriteMovieIds array."
    // This now perfectly matches your schema.
    const movies = await Movie.find({ _id: { $in: favoriteMovieIds } });

    res.json({
      success: true,
      movies,
    });
    
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching favorites.",
    });
  }
};