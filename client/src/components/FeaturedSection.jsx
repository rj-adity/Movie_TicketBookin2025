import { ArrowRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BlurCircle from './BlurCircle';
// import { dummyShowsData } from '../assets/assets';
import MovieCard from './MovieCard';
import { useAppContext } from '../context/AppContext';
import Loading from './Loading'; // A placeholder for a loading indicator

const FeaturedSection = () => {

  const navigate = useNavigate();
  const { shows } = useAppContext();

  // --- [THE FIX IS HERE] ---
  // If `shows` is null or undefined (meaning it's still loading from the API),
  // we should not try to render the list. We return early.
  // Showing a loading indicator is best practice, but returning null also works.
  if (!shows) {
    // You can replace this with a proper <Loading /> component
    // to prevent layout shifts.
    return (
      <div className="flex justify-center items-center h-60">
        <Loading />
      </div>
    );
  }
  // After this check, it is guaranteed that `shows` is an array (even if empty).

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden'>
      <div className='relative flex items-center justify-between pt-20 pb-10'>
        <BlurCircle top='0' right='-80px' />
        <p className='text-gray-300 font-medium text-lg'>Now Showing</p>
        <button
          onClick={() => navigate('/movies')}
          className='group flex items-center gap-2 text-sm text-gray-300 cursor-pointer'
        >
          View All
          <ArrowRight className='group-hover:translate-x-0.5 transition w-4.5 h-4.5' />
        </button>
      </div>

      <div className='flex flex-wrap max-sm:justify-center gap-8 mt-8'>
        {/* It is now safe to call .slice() on `shows` */}
        {shows.slice(0, 4).map((show) => (
          // In your code you pass `movie={show}` to MovieCard. This assumes MovieCard
          // expects a prop named 'movie'. Your shows are also movies.
          <MovieCard key={show._id || show.id} movie={show} />
        ))}
      </div>

      <div className='flex justify-center mt-20'>
        <button
          onClick={() => {
            navigate('/movies');
            scrollTo(0, 0);
          }}
          className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
        >
          Show more
        </button>
      </div>
    </div>
  );
};

export default FeaturedSection;