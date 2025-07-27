import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

// Fallback image in case of missing or broken poster/profile image
const FALLBACK_MOVIE_IMAGE = '/default-movie.jpg';
const FALLBACK_CAST_IMAGE = '/default-cast.jpg';

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This is the SHOW ID
  const [show, setShow] = useState(null);
  const [error, setError] = useState(null);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies, // This function comes from context
    favoriteMovies,
    image_base_url
  } = useAppContext();

  // The derived movie object we will work with. This pattern is correct.
  const movie = show?.movie || {};

  // Fetch movie/show data safely and handle errors. This function is correct.
  const getShow = async () => {
    setError(null);
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data && data.success) {
        setShow(data);
      } else {
        setError('Movie not found.');
      }
    } catch (err) {
      setError('Could not fetch movie details.');
      console.error(err);
    }
  };

  // --- [FIX #1] Add/remove from favorites with correct Movie ID and user guard ---
  const handleFavorite = async () => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }
    // Safety check to ensure the movie data has loaded before trying to use its ID
    if (!movie._id) {
        toast.error('Movie details are not available yet.');
        return;
    }
    try {
      // Use the movie's own ID (`movie._id`), NOT the show's ID from the URL (`id`).
      const { data } = await axios.post(
        '/api/user/update-favorites',
        { movieId: movie._id }, 
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data && data.success) {
        // After success, we MUST refetch the list to update the UI everywhere.
        await fetchFavoriteMovies(); 
        toast.success(data.message || 'Favorites updated!');
      } else {
        // Show the error message from the backend if it exists
        toast.error(data.message || 'Failed to update favorites.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error updating favorites';
      toast.error(errorMessage);
      console.error("Error in handleFavorite:", error);
    }
  };

  useEffect(() => {
    getShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived safe values are all correct
  const posterPath = movie.poster_path ? image_base_url + movie.poster_path : FALLBACK_MOVIE_IMAGE;
  const title = movie.title || '';
  const voteAverage = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A';
  const genres = Array.isArray(movie.genres) ? movie.genres.map((g) => g.name).join(', ') : '';
  const releaseYear = typeof movie.release_date === 'string' && movie.release_date.split('-').length ? movie.release_date.split('-')[0] : '';
  const runtimeText = typeof movie.runtime === 'number' ? timeFormat(movie.runtime) : '';
  const overview = movie.overview || '';
  const casts = Array.isArray(movie.casts) ? movie.casts : [];
  const dateTime = show?.dateTime || [];

  // --- [FIX #2] A clean boolean to check if the current movie is a favorite ---
  // It checks if any movie (`fav`) in the `favoriteMovies` array has an ID that matches
  // the ID of the movie currently displayed on the page (`movie._id`).
  const isFavorite = Array.isArray(favoriteMovies) && favoriteMovies.some((fav) => fav._id === movie._id);

  // Error/loading UI is correct
  if (error) { return <div>{error}</div> }
  if (!show) { return <Loading />; }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      {/* Movie Poster and Details */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={posterPath}
          alt={title}
          className="max-md:mx-auto rounded-xl h-104 w-70 max-w-xs object-cover"
        />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">English</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{title}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />{voteAverage} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{overview}</p>
          <p>{(runtimeText ? runtimeText + ' · ' : '')}{genres ? genres + ' · ' : ''}{releaseYear}</p>
          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium">
              <PlayCircleIcon className="w-5 h-5" />Watch Trailer
            </button>
            <a href="#dateSelect" className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium">
              Buy Tickets
            </a>
            {/* The Heart button now uses our `isFavorite` boolean for cleaner, correct logic */}
            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Add or remove from favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {casts.length > 0 && (
        <>
          <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
          <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
            <div className="flex items-center gap-4 w-max px-4">
              {casts.slice(0, 12).map((cast) => (
                <div key={cast.id || cast.name}>
                  <img
                    src={
                      cast.profile_path
                        ? image_base_url + cast.profile_path
                        : FALLBACK_CAST_IMAGE
                    }
                    alt={cast.name || ''}
                    className="rounded-full h-20 md:h-20 aspect-square object-cover"
                    onError={(e) => {
                      if (e.target.src !== window.location.origin + FALLBACK_CAST_IMAGE) {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_CAST_IMAGE;
                      }
                    }}
                  />
                  <p className="font-medium text-xs mt-3">{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Date Picker */}
      <DateSelect dateTime={dateTime} id={String(id)} />

      {/* You May Also Like */}
      {Array.isArray(shows) && shows.length > 0 && (
        <>
          <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
          <div className="flex flex-wrap max-sm:justify-center gap-8">
            {shows.slice(0, 4).map((movie) => (
              <MovieCard key={movie._id || movie.id} movie={movie} />
            ))}
          </div>
        </>
      )}

      {/* Show More Button */}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => navigate('/movies')}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default MovieDetails;
