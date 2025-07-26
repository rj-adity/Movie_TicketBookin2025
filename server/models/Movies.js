import mongoose from "mongoose";

const castSchema = new mongoose.Schema({
  cast_id: Number,
  character: String,
  credit_id: String,
  gender: Number,
  id: Number,
  name: String,
  order: Number,
  profile_path: String
}, { _id: false });

const genreSchema = new mongoose.Schema({
  id: Number,
  name: String
}, { _id: false });

const movieSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    overview: { type: String, required: true },
    poster_path: { type: String, required: true },
    backdrop_path: { type: String, required: true },
    release_date: { type: String, required: true },
    original_language: { type: String },
    tagline: { type: String },
    genres: [genreSchema],  
    casts: [castSchema],    
    vote_average: { type: Number, required: true },
    runtime: { type: Number, required: true },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;