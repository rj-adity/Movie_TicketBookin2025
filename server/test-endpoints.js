import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Test endpoints
const testEndpoints = async () => {
    console.log('🧪 Testing API Endpoints...\n');

    try {
        // Test 1: Health check
        console.log('1. Testing health check endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Health check:', healthResponse.data);
        console.log('');

        // Test 2: Get all shows
        console.log('2. Testing get all shows endpoint...');
        const showsResponse = await axios.get(`${BASE_URL}/api/show/all`);
        console.log('✅ Get all shows:', {
            success: showsResponse.data.success,
            movieCount: showsResponse.data.movies?.length || 0,
            hasMovies: showsResponse.data.movies?.length > 0
        });
        
        // Check if cast data is visible
        if (showsResponse.data.movies?.length > 0) {
            const firstMovie = showsResponse.data.movies[0];
            console.log('   📋 First movie cast data:', {
                hasCast: Array.isArray(firstMovie.casts),
                castCount: firstMovie.casts?.length || 0,
                castSample: firstMovie.casts?.slice(0, 2) || []
            });
        }
        console.log('');

        // Test 3: Get specific movie shows (if movies exist)
        if (showsResponse.data.movies?.length > 0) {
            const movieId = showsResponse.data.movies[0]._id;
            console.log(`3. Testing get specific movie shows (ID: ${movieId})...`);
            
            const movieShowsResponse = await axios.get(`${BASE_URL}/api/show/${movieId}`);
            console.log('✅ Get movie shows:', {
                success: movieShowsResponse.data.success,
                hasMovie: !!movieShowsResponse.data.movie,
                hasDateTime: !!movieShowsResponse.data.dateTime,
                dateTimeKeys: Object.keys(movieShowsResponse.data.dateTime || {}),
                totalShows: movieShowsResponse.data.totalShows || 0
            });

            // Check cast visibility in specific movie
            if (movieShowsResponse.data.movie) {
                console.log('   📋 Movie cast data:', {
                    hasCast: Array.isArray(movieShowsResponse.data.movie.casts),
                    castCount: movieShowsResponse.data.movie.casts?.length || 0
                });
            }
        }

        console.log('\n🎉 All public endpoints tested successfully!');

    } catch (error) {
        console.error('❌ Test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
};

// Run tests
testEndpoints();