import { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [shows, setShows] = useState(null);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original';

    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // Inside src/context/AppContext.js

// ... (imports and other functions) ...

// --- ADD LOGS TO THIS FUNCTION ---
const fetchIsAdmin = async () => {
    // We start the loading state right away.
    setIsAdminLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsAdmin(false); // If no token, not an admin
        setIsAdminLoading(false); // Stop loading
        return;
      }
      
      console.log('%c[AppContext] Step 1: Running fetchIsAdmin...', 'color: cyan;');
      const { data } = await axios.get('/api/admin/is-admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('%c[AppContext] Step 2: Backend response for isAdmin check:', 'color: cyan;', data);

      if (data.success && data.isAdmin) {
        console.log('%c[AppContext] Step 3: Setting isAdmin state to true.', 'color: lightgreen; font-weight: bold;');
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("[AppContext] Error fetching admin status:", error);
      setIsAdmin(false);
    }
    // This is the most important part that prevents infinite loading
    console.log('%c[AppContext] Step 4: Setting isAdminLoading state to false.', 'color: red; font-weight: bold;');
    setIsAdminLoading(false);
};

    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/show/all');
            if (data.success && Array.isArray(data.movies)) {
                setShows(data.movies);
            } else { setShows([]); }
        } catch (error) { setShows([]); }
    };

    const fetchFavoriteMovies = async () => {
        if (!user) return;
        try {
            const token = await getToken();
            if (!token) return;
            const { data } = await axios.get('/api/user/favorites', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success && Array.isArray(data.movies)) {
                setFavoriteMovies(data.movies);
            }
        } catch (error) { console.error("Error fetching favorite movies:", error); }
    };

    const handleFavorite = async (movie) => {
        if (!user) { toast.error("Please login"); return; }
        if (!movie || !movie._id) { toast.error("Invalid movie data"); return; }
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/user/update-favorites', 
                { movieId: movie._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message || 'Updated!');
                await fetchFavoriteMovies(); 
            } else {
                toast.error(data.message || 'Failed to update');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error updating favorites';
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        if (user) {
            fetchIsAdmin();
            fetchFavoriteMovies();
        } else {
            setIsAdmin(false);
            setFavoriteMovies([]);
        }
    }, [user]);

    const value = useMemo(() => ({
        axios,
        fetchIsAdmin,
        user,
        getToken,
        navigate,
        isAdmin,
        isAdminLoading,
        shows,
        favoriteMovies,
        image_base_url,
        // [THE FIX IS HERE]
        // Both functions must be included in the context value
        fetchFavoriteMovies, // <-- THIS LINE WAS MISSING
        handleFavorite
    }), [user, getToken, navigate, isAdmin, isAdminLoading, shows, favoriteMovies]); // No need to list functions in dep array if they don't use useCallback

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);